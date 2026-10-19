pipeline {
    agent {
        docker {
            image 'node:22-bookworm-slim'
            args '-u root:root'
        }
    }

    options {
        timestamps()
        timeout(time: 10, unit: 'MINUTES')
        skipDefaultCheckout(true)
    }

    parameters {
        choice(
            name: 'FAIL_STAGE',
            choices: ['None', 'Lint', 'Build', 'Verify', 'Archive', 'Publish'],
            description: 'Select a stage for controlled failure testing.'
        )
    }

    environment {
        NEXUS_REGISTRY = 'http://nexus:8081/repository/kijanikiosk-npm/'
        PACKAGE_NAME = 'kijanikiosk-payments'
        PACKAGE_VERSION = ''
        GIT_SHA = ''
    }

    stages {
        stage('Lint') {
            steps {
                checkout scm
                script {
                    env.GIT_SHA = sh(
                        script: 'git rev-parse --short=7 HEAD',
                        returnStdout: true
                    ).trim()

                    env.PACKAGE_VERSION = sh(
                        script: "node -p \"require('./package.json').version\"",
                        returnStdout: true
                    ).trim() + "-${env.GIT_SHA}"

                    if (params.FAIL_STAGE == 'Lint') {
                        error('Injected failure: Lint')
                    }
                }
                sh 'npm ci && npm run lint'
            }
        }

        stage('Build') {
            steps {
                script {
                    if (params.FAIL_STAGE == 'Build') {
                        error('Injected failure: Build')
                    }
                }
                sh '''
                    npm version "$PACKAGE_VERSION" --no-git-tag-version
                    npm ci
                    npm run build
                '''
            }
        }

        stage('Verify') {
            parallel {
                stage('Test') {
                    steps {
                        script {
                            if (params.FAIL_STAGE == 'Verify') {
                                error('Injected failure: Verify')
                            }
                        }
                        sh '''
                            mkdir -p reports
                            npm test -- --test-reporter=junit \
                              --test-reporter-destination=reports/junit.xml
                        '''
                    }
                }

                stage('Security Audit') {
                    steps {
                        sh 'npm audit --omit=dev'
                    }
                }
            }
        }

        stage('Archive') {
            steps {
                script {
                    if (params.FAIL_STAGE == 'Archive') {
                        error('Injected failure: Archive')
                    }
                }
                sh 'npm pack --pack-destination dist'
                archiveArtifacts(
                    artifacts: 'dist/**,reports/junit.xml,package.json,package-lock.json',
                    fingerprint: true
                )
            }
        }

        stage('Publish') {
            steps {
                script {
                    if (params.FAIL_STAGE == 'Publish') {
                        error('Injected failure: Publish')
                    }
                }

                withCredentials([
                    usernamePassword(
                        credentialsId: 'nexus-publisher',
                        usernameVariable: 'NEXUS_USER',
                        passwordVariable: 'NEXUS_PASSWORD'
                    )
                ]) {
                    sh '''
                        set -eu
                        AUTH=$(printf '%s' "$NEXUS_USER:$NEXUS_PASSWORD" | base64 | tr -d '\\n')

                        trap 'rm -f .npmrc' EXIT
                        printf '%s\\n' \
                          "registry=$NEXUS_REGISTRY" \
                          "//nexus:8081/repository/kijanikiosk-npm/:_auth=$AUTH" \
                          "//nexus:8081/repository/kijanikiosk-npm/:always-auth=true" \
                          > .npmrc

                        npm publish "dist/$PACKAGE_NAME-$PACKAGE_VERSION.tgz" \
                          --registry="$NEXUS_REGISTRY"
                    '''
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'reports/junit.xml'
            echo 'Pipeline finished; test results have been collected when available.'
            deleteDir()
        }

        success {
            echo "SUCCESS: Published $PACKAGE_NAME@$PACKAGE_VERSION"
            echo "Artifact URL: ${NEXUS_REGISTRY}${PACKAGE_NAME}/-/${PACKAGE_NAME}-${PACKAGE_VERSION}.tgz"
        }

        failure {
            echo "FAILURE NOTIFICATION: ${env.JOB_NAME} #${env.BUILD_NUMBER} failed. Check the stage logs."
        }

        changed {
            echo "STATUS TRANSITION NOTIFICATION: ${env.JOB_NAME} changed its overall build status."
        }
    }
}
