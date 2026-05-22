import jwt from "jsonwebtoken";
export const auth = (req,res,next)=>{ const token=req.headers.authorization?.split(" ")[1]; if(!token) return res.status(401).json({message:"Unauthorized"}); try{ req.user=jwt.verify(token,process.env.JWT_SECRET); next(); }catch{ res.status(401).json({message:"Invalid token"}); }};
export const adminOnly=(req,res,next)=>req.user?.role==="admin"?next():res.status(403).json({message:"Forbidden"});
