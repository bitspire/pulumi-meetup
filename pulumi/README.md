# Pulumi Demos

Initialize stack backend to local file

```shell
pulumi login file://.

# Verify backend setup
pulumi whoami -v
```

Create new project from public samples

```shell
pulumi new https://github.com/pulumi/examples/tree/master/aws-ts-s3-lambda-copyzip --dir aws-s3-lambda
```