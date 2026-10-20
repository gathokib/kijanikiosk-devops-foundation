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
        timeout(time: 15, unit: 'MINUTES')
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
                }

                sh '''
                    set -eu

                    GIT_SHA=$(git rev-parse --short=7 HEAD)
                    BASE_VERSION=$(node -p "require('./package.json').version")
                    PACKAGE_VERSION="${BASE_VERSION}-${GIT_SHA}"

                    printf '%s\\n' "$PACKAGE_VERSION" > .package-version

                    echo "Building package: $PACKAGE_NAME@$PACKAGE_VERSION"

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
                    PACKAGE_VERSION=$(cat .package-version)
                    mkdir -p dist
                    npm pack --pack-destination dist
                    echo "Created package artifact for version $PACKAGE_VERSION"
                '''

                archiveArtifacts(
                    artifacts: 'dist/**,reports/junit.xml,package.json,package-lock.json,.package-version',
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

                        PACKAGE_VERSION=$(cat .package-version)
                        AUTH=$(printf '%s' "$NEXUS_USER:$NEXUS_PASSWORD" | base64 | tr -d '\\n')

                        trap 'rm -f .npmrc' EXIT

                        NEXUS_HOST_PATH=$(printf '%s' "$NEXUS_REGISTRY" |
                            sed -E 's#^https?://##; s#/$##')

                        printf '%s\\n' \
                            "registry=$NEXUS_REGISTRY" \
                            "//$NEXUS_HOST_PATH/:_auth=$AUTH" \
                            "always-auth=true" > .npmrc

                        # The leading ./ is required: without it npm treats
                        # "dist/<file>.tgz" as a GitHub user/repo shorthand.
                        npm publish "./dist/$PACKAGE_NAME-$PACKAGE_VERSION.tgz" \
                            --registry="$NEXUS_REGISTRY"

                        echo "Published $PACKAGE_NAME@$PACKAGE_VERSION"
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

            // Container runs as root, so hand files back to the Jenkins user
            // (uid 1000) before deleteDir() runs as a non-root process.
            sh 'chown -R 1000:1000 "$WORKSPACE" || true'
            deleteDir()
        }

        success {
            echo 'CI pipeline completed successfully.'
            echo "Package: ${env.PACKAGE_NAME}"
            echo "Registry: ${env.NEXUS_REGISTRY}"
        }

        failure {
            echo 'CI pipeline failed. Review the first failing stage and its console output.'
        }

        changed {
            echo 'The pipeline build result changed from the previous build.'
        }
    }
}
