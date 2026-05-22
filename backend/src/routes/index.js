import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "../middleware/auth.js";
import { User, Expense, Salary, IncomeSource, Savings, GoldAsset, SilverAsset, Stock, MutualFund, EmiPayment } from "../models/index.js";
const router = Router();
router.get("/health", (_,res)=>res.json({ok:true}));
router.post("/auth/register", async (req,res)=>{ const body=z.object({name:z.string(),email:z.string().email(),password:z.string().min(8)}).parse(req.body); const password=await bcrypt.hash(body.password,10); const user=await User.create({...body,password}); res.json({id:user._id});});
router.post("/auth/login", async(req,res)=>{ const {email,password}=req.body; const user=await User.findOne({email}); if(!user||!(await bcrypt.compare(password,user.password))) return res.status(401).json({message:"Invalid creds"}); const token=jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN}); res.json({token});});
router.get("/dashboard/summary", auth, async(req,res)=>{ const userId=req.user.id; const [expenses,salary,income,savings,gold,silver,stocks,mf,emiDue]=await Promise.all([
Expense.aggregate([{$match:{userId}},{$group:{_id:null,total:{$sum:"$amount"}}}]),Salary.aggregate([{$match:{userId}},{$group:{_id:null,total:{$sum:"$amount"}}}]),IncomeSource.aggregate([{$match:{userId}},{$group:{_id:null,total:{$sum:"$amount"}}}]),Savings.aggregate([{$match:{userId}},{$group:{_id:null,total:{$sum:"$amount"}}}]),GoldAsset.aggregate([{$match:{userId}},{$group:{_id:null,total:{$sum:"$value"}}}]),SilverAsset.aggregate([{$match:{userId}},{$group:{_id:null,total:{$sum:"$value"}}}]),Stock.aggregate([{$match:{userId}},{$group:{_id:null,total:{$sum:"$currentValue"}}}]),MutualFund.aggregate([{$match:{userId}},{$group:{_id:null,total:{$sum:"$currentValue"}}}]),EmiPayment.find({userId,status:"pending"}).sort({dueDate:1}).limit(5)
]);
const get=(a)=>a[0]?.total||0; const totalIncome=get(salary)+get(income); const totalExpenses=get(expenses); const totalWealth=get(savings)+get(gold)+get(silver)+get(stocks)+get(mf); res.json({totalIncome,totalExpenses,remainingBalance:totalIncome-totalExpenses,totalWealth,emiDue});
});
router.post("/expenses", auth, async(req,res)=>res.json(await Expense.create({...req.body,userId:req.user.id})));
router.get("/ai/insights", auth, async(req,res)=>res.json({insights:["You spent 40% of salary on expenses this month.","Food expenses increased by 12%.","Savings improved compared to last month."],recommendations:["Set weekly caps for food and transport","Auto-transfer 20% salary into emergency fund"]}));
export default router;
