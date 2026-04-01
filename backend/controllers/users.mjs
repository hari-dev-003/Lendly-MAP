import express from "express";
import Signup from "../schemas/signup.schema.mjs";

const getusers = async (req,res)=>{
    try{
        const users =  await Signup.find();
        res.status(200).send({message : 'Users retrieved successfully' , users : users});
    }
    catch(error){
        res.status(400).send({message : 'Error retrieving users' , error : error.message});
    }
}

export {getusers};