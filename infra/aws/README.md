# AWS frontend

The Mola frontend exports to static HTML/JS. This deployment serves the current demo and browser-local Kanban data; it does not publish a backend API.

```sh
npm run build:aws
# Optional: export AWS_PROFILE and AWS_REGION, or rely on the default credential chain.
# Quiet STS check (no Account/Arn printed):
aws sts get-caller-identity --region "${AWS_REGION:-us-east-1}" >/dev/null
npm run deploy:aws -- "${AWS_PROFILE:-}" "${AWS_REGION:-us-east-1}" resolveqa-frontend
```

The CloudFormation stack creates an encrypted, private S3 bucket and a public HTTPS CloudFront distribution. Origin Access Control restricts bucket reads to this distribution. No server or database is provisioned. CloudFront/S3 usage is billed by AWS.

## URLs and routing

Next `output: 'export'` writes objects such as `index.html`, `admin.html`, and `quadro.html` (plus `/_next/...` assets). Clean paths without the `.html` suffix would 404 against the private OAC origin unless rewritten.

A CloudFront Function (`PrettyUrlRewrite`, runtime `cloudfront-js-2.0`, `AutoPublish: true`) is associated on the default cache behavior as `viewer-request` and rewrites only:

| Viewer URI | Origin object |
|---|---|
| `/admin` or `/admin/` | `/admin.html` |
| `/quadro` or `/quadro/` | `/quadro.html` |

Everything else is unchanged, including `/`, `/index.html`, `/_next/*`, `*.txt`, `/admin.txt`, `/quadro.html`, and unknown paths (still handled by existing 403/404 → `/404.html` custom error responses). The bucket stays private; cache policy, OAC, HTTPS redirect, and security headers are preserved.

## Deploy notes

The deploy script validates credentials quietly (no Account/Arn on stdout), uploads the export, and waits for cache invalidation. HTML uses revalidation; hashed assets are immutable. Existing assets and S3 object versions are preserved for recovery. Deleting the stack retains the bucket and its contents.

For a new release, build the intended commit and run the same deploy command. For rollback, build the previous commit in its own checkout and deploy it to the same stack. No Git merge is performed by these commands.
