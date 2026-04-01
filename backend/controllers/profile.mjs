import express from 'express';
import Profile from '../schemas/profile.schema.mjs';

const profile = async(req,res)=>{
    try{
        const {name , phone , address , district , state} = req.body;

        const newProfile = await Profile.create({
            name,
            phone,
            address,
            district,
            state
        });

        res.status(201).send({message : 'Profile created successfully' , profile : newProfile});
    } catch (error) {
        res.status(400).send({message : 'Error creating profile' , error : error.message});
    }
}

export {profile};
