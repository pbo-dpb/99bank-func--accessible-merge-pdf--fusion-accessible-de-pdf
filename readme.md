This repository contains the code of an AWS Lambda function that is used to merge two PDFs while keeping the original PDF's tagging and structure.

## Expects

It expects an incoming event with the following structure:

```
{
    "cover": "https://example.com/first.pdf", // Could also be "first"
    "main": "https://example.com/second.pdf",
    "title": "Custom Title for Merged PDF", // Optional
    "output": "99bank-func--accessible-merge-pdf--fusion-accessible-de-pdf/merged.pdf",
    "bucket": "99bank-lambda-interchange"
}
```

Where:
- `cover`: The URL of the first PDF to merge - used instead of `first`. When `cover` is set, the first page of the `main` PDF will be removed.
- `first`: The URL of a first PDF - used instead of `cover` if `cover` is not set. When using `first`, the `main` PDF will stay untouched (first page will not be removed).
- `main`: The URL of the second PDF to merge.
- `title`: (Optional) The title to set for the merged PDF. If not provided, the title from the `main` PDF will be used.
- `output`: The S3 path where the merged PDF will be stored.
- `bucket`: The S3 bucket where the merged PDF will be stored.


## Running locally

1. Install dependencies

`npm install`

2. Create an AWS CLI configuration file (https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)

```
cat << EOF > ~/.aws/configure
region = ca-central-1
EOF

cat << EOF > ~/.aws/credentials
aws_access_key_id=[KEY]
aws_secret_access_key=[SECRET]
EOF
```

3. Install [Lambda Local](https://www.npmjs.com/package/lambda-local)

`sudo npm install -g lambda-local`

4. Run function

`npm run local`

## Deploying

You can deploy this function to Lambda using the AWS CLI:

```
$ npm run build
$ npm run export
$ aws lambda update-function-code --function-name my-function-name --zip-file fileb://build/function.zip
```

See `.github/workflows/compile-and-release.yml` GitHub Action for an example of how to automate this process.