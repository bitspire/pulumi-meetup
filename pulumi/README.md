# Pulumi Demos

Initialize stack backend to local file

```shell
pulumi login file://.

# Verify backend setup
pulumi whoami -v
```

## AWS S3 Lambda sample

Create new project from public samples

```shell

export PULUMI_CONFIG_PASSPHRASE=very-long-random-pass
pulumi new https://github.com/pulumi/examples/tree/master/aws-ts-s3-lambda-copyzip --dir aws-s3-lambda
cd aws-s3-lambda

pulumi config set aws:region us-east-1

```

Upgrade and install dependencies

```shell

yarn update --latest
yarn install

```

Configure AWS credentials

Create a user with IAMRole, S3 and Lambda full access, then run `aws configure` and provide generated credentials

```shell

pulumi up

pulumi stack output --json

```

Clean up

- Delete all objects in the two buckets first

```shell

pulumi destroy

```

## GCP CloudRun

```shell
gcloud auth application-default login
```


```shell

export PULUMI_CONFIG_PASSPHRASE=very-long-random-pass

pulumi new https://github.com/pulumi/examples/tree/master/gcp-ts-functions --dir gcp-ts-functions
cd gcp-ts-functions

pulumi config set gcp:project <projectname>
pulumi config set gcp:region <region>

pulumi up

```
