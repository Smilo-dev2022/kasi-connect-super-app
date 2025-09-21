# Secrets Rotation Runbook

This document outlines the procedure for rotating secrets for the kasi-connect application.

## Procedure

1.  **Identify the secret to rotate:** Determine which secret needs to be updated. Secrets are stored in AWS Secrets Manager and are prefixed with `kasi-connect-`.

2.  **Generate a new secret value:** Use a strong password generator to create a new value for the secret.

3.  **Update the secret in AWS Secrets Manager:**
    *   Navigate to the AWS Secrets Manager console.
    *   Find the secret you want to update.
    *   Click "Retrieve secret value".
    *   Click "Edit".
    *   Paste the new secret value.
    *   Save the changes.

4.  **Restart the affected services:** The new secret value will be picked up by the services on their next restart. You can trigger a rolling restart of the deployments in Kubernetes:
    ```bash
    kubectl rollout restart deployment/<deployment-name>
    ```

5.  **Verify the new secret:** Check the logs of the restarted services to ensure they are running correctly with the new secret.

## Automated Rotation

For secrets that support it (like the RDS password), automated rotation should be configured in AWS Secrets Manager. This runbook is for manual rotation of other secrets.
