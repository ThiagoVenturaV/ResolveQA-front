# AWS frontend

The Mola frontend exports to static HTML/JS. This deployment serves the current demo and browser-local Kanban data; it does not publish a backend API.

```sh
npm run build:aws
aws login  --region us-east-1
npm run deploy:aws -- resolveqa us-east-1 resolveqa-frontend
```

The CloudFormation stack creates an encrypted, private S3 bucket and a public HTTPS CloudFront distribution. Origin Access Control restricts bucket reads to this distribution. No server or database is provisioned. CloudFront/S3 usage is billed by AWS.

The deploy script prints the active account before deployment, uploads the export, and waits for cache invalidation. HTML uses revalidation; hashed assets are immutable. Existing assets and S3 object versions are preserved for recovery. Deleting the stack retains the bucket and its contents.

For a new release, build the intended commit and run the same deploy command. For rollback, build the previous commit in its own checkout and deploy it to the same stack. No Git merge is performed by these commands.
