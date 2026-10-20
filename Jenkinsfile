
pipeline {
    agent {
        docker {
            image 'node:22-bookworm-slim'
            args '-u root:root'
            alwaysPull false
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
            description: 'Select a stage to intentionally fail for testing'
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

                sh '''
                    set -eu
                    apt-get update
                    apt-get install -y --no-install-recommends git
                    rm -rf /var/lib/apt/lists/*
                    git config --global --add safe.directory "$WORKSPACE"
                '''

                script {
                    if (params.FAIL_STAGE == 'Lint') {
                        error('Injected failure: Lint')
                    }
                }

                sh '''
                    set -eu
                    npm ci
                    npm run lint
                '''
            }
        }

        stage('Build') {
            steps {
                script {
                    if (params.FAIL_STAGE == 'Build') {
                        error('Injected failure: Build')
                    }

                    env.GIT_SHA = sh(
                        script: 'git rev-parse --short=7 HEAD',
                        returnStdout: true
                    ).trim()

                    env.PACKAGE_VERSION = sh(
                        script: "node -p \"require('./package.json').version\"",
                        returnStdout: true
                    ).trim() + "-${env.GIT_SHA}"
                }

                sh '''
                    set -eu
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
                            set -eu
                            mkdir -p reports
                            npm test -- --test-reporter=junit --test-reporter-destination=reports/junit.xml
                        '''
                    }
                }

                stage('Security Audit') {
                    steps {
                        sh '''
                            set -eu
                            npm audit --omit=dev
                        '''
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

                sh '''
                    set -eu
                    mkdir -p dist
                    npm pack --pack-destination dist
                '''

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
                            "//$(
                                printf '%s' "$NEXUS_REGISTRY" |
                                sed -E 's#^https?://##; s#/$##'
                            )/:_auth=$AUTH" \
                            "always-auth=true" > .npmrc

                        npm publish "dist/$PACKAGE_NAME-$PACKAGE_VERSION.tgz" \
                            --registry="$NEXUS_REGISTRY"
                    '''
                }
            }
        }
    }

    post {
        always {
            junit(
                allowEmptyResults: true,
                testResults: 'reports/junit.xml'
            )

            echo 'CI pipeline finished. Check the stages above for results.'
            deleteDir()
        }

        success {
            echo "Successfully published ${PACKAGE_NAME}@${PACKAGE_VERSION}."
            echo "Artifact repository: ${NEXUS_REGISTRY}"
        }

        failure {
            echo 'CI pipeline failed. Review the first failing stage and its console output.'
        }

        changed {
            echo 'The pipeline build result changed from the previous build.'
        }
    }
}
