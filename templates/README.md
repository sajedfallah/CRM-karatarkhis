# Canonical Role Templates

این پوشه Snapshot قابل version-control از چهار RAW Template رسمی Google Sheets را نگه می‌دارد.

## Files

| Role | GitHub export | Google Drive canonical ID |
|---|---|---|
| مدیر | `RAW_Admin.xlsx` | `1Zt890HbsaHUS20ldmzWSrH0rRIEAuDgpavr8dqxxHBw` |
| کارمند داخلی | `RAW_Internal_Employee.xlsx` | `1o3gttxWKKwLdJ8tbR5JShbLy7uC5UcIYdGjFvxLdqJ0` |
| مدیر مشتری | `RAW_Customer_Manager.xlsx` | `1m_Ao7XQMVlhhsMx4AR82b60GCK0XHKXhTW_S5BxKIAI` |
| کارمند مشتری | `RAW_Customer_Employee.xlsx` | `1eesSiyEhUr4qJkp4rK3qtRnt3w3X0yXH08dfZ08cXiE` |

## Rule

Google Drive RAW files are the live canonical design source. The XLSX files in GitHub are review/version snapshots.

For any role UI change:
1. Modify the correct RAW Template.
2. Test on a copy.
3. Update migration logic for existing workspaces.
4. Verify RBAC, formulas and validations.
5. Re-export the template to this folder.
6. Commit the updated export together with code/docs changes.

Never use a LIVE dashboard as provisioning source.
