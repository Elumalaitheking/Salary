"use client";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
const data=[{m:"Jan",income:800,expense:520},{m:"Feb",income:900,expense:560},{m:"Mar",income:950,expense:610},{m:"Apr",income:980,expense:640}];
export default function Dashboard(){
  const cards=["Total Balance","Salary Received","Total Income","Total Expenses","Savings","Gold","Silver","Stocks","Mutual Funds","EMI Due"];
  return <main className="min-h-screen p-6">
    <h1 className="text-3xl font-bold mb-6">Smart Expense & Wealth Tracker Pro</h1>
    <section className="grid md:grid-cols-5 gap-4">{cards.map(c=><motion.div whileHover={{scale:1.02}} key={c} className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/20"><p className="text-sm text-slate-300">{c}</p><p className="text-xl font-semibold">₹0.00</p></motion.div>)}</section>
    <section className="mt-8 rounded-2xl bg-white/10 p-4 border border-white/20 h-80"><p className="mb-3">Income vs Expense</p><ResponsiveContainer width="100%" height="90%"><LineChart data={data}><XAxis dataKey="m"/><YAxis/><Tooltip/><Line type="monotone" dataKey="income" stroke="#22c55e"/><Line type="monotone" dataKey="expense" stroke="#ef4444"/></LineChart></ResponsiveContainer></section>
  </main>;
}
