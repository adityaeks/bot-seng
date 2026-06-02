# FLOW.md

## System Flow

Application Start
│
▼
Load Environment
│
▼
Initialize WhatsApp Client
│
▼
Generate QR (First Login)
│
▼
Authenticate User
│
▼
Save Session
│
▼
Register Cron Jobs
│
▼
Wait For Schedule
│
▼
Schedule Triggered
│
▼
Build Message
│
▼
Send WhatsApp Message
│
▼
Write Log
│
▼
Wait Next Schedule

---

07:00 Trigger

Cron
│
▼
Morning Reminder
│
▼
Send WhatsApp
│
▼
Log Success / Failed

---

13:00 Trigger

Cron
│
▼
Afternoon Reminder
│
▼
Send WhatsApp
│
▼
Log Success / Failed

---

17:00 Trigger

Cron
│
▼
Evening Reminder
│
▼
Send WhatsApp
│
▼
Log Success / Failed
