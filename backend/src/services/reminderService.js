import cron from "node-cron";
export const startReminderJobs = ()=>{
  cron.schedule("0 20 * * *", ()=>{ console.log("Reminder: Please update today's expenses and balances."); });
};
