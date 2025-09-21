# Database Backup and Restore Runbook

This document outlines the procedure for backing up and restoring the application's RDS PostgreSQL database.

## Automated Backups

The RDS instance is configured with automated daily backups and a retention period of 7 days. These backups are managed by AWS and can be used for point-in-time recovery.

## Point-in-Time Recovery (PITR)

Point-in-time recovery allows you to restore the database to any second within the backup retention period. This creates a *new* RDS instance with the restored data.

### Using the AWS Management Console

1.  **Navigate to the RDS Console:** Open the AWS Management Console and go to the RDS service.
2.  **Select the Database:** In the "Databases" list, select the database instance you want to restore (e.g., `kasi-connect-pg`).
3.  **Initiate Restore:** Click the "Actions" menu and select "Restore to point in time".
4.  **Choose a Restore Time:**
    *   Select either "Latest restorable time" or "Custom" to specify an exact date and time (in UTC).
5.  **Configure the New DB Instance:**
    *   Provide a unique "DB instance identifier" for the new restored instance (e.g., `kasi-connect-pg-restored`).
    *   Configure the instance settings as needed. It's usually best to keep them the same as the original instance unless you are testing or resizing.
6.  **Launch Restore:** Click the "Restore DB instance" button. The new instance will be created and will become available after some time.

### Using the AWS CLI

You can also perform a point-in-time recovery using the AWS CLI.

1.  **Find the Latest Restorable Time (Optional):**
    ```bash
    aws rds describe-db-instances --db-instance-identifier kasi-connect-pg --query 'DBInstances[0].LatestRestorableTime'
    ```

2.  **Run the Restore Command:**
    ```bash
    aws rds restore-db-instance-to-point-in-time \
        --source-db-instance-identifier kasi-connect-pg \
        --target-db-instance-identifier kasi-connect-pg-restored \
        --restore-time "YYYY-MM-DDTHH:MM:SSZ" \
        --db-instance-class db.t3.micro \
        --no-publicly-accessible
    ```
    *   Replace `YYYY-MM-DDTHH:MM:SSZ` with the desired UTC timestamp.
    *   Adjust other parameters like `--db-instance-class` as needed.

## Post-Restore Actions

After restoring the database, you will need to:
1.  **Update Application Configuration:** Update the application's configuration (i.e., the `EVENTS_DATABASE_URL` secret in AWS Secrets Manager) to point to the new database instance's endpoint.
2.  **Restart Application:** Restart the application pods in Kubernetes to use the new database connection.
3.  **Decommission the Old Instance:** Once you have verified that the restored database is working correctly, you can decommission the old database instance if it is no longer needed.
