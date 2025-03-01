"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { AwardIcon } from "lucide-react";
import { revalidatePath } from "next/cache";
import { use } from "react";

export async function syncUser() {
    try {
        const {userId} = await auth()
        const user= await currentUser()
        if (!user || !userId) {
            return
        }

        const existingUser = await prisma.user.findUnique({
            where:{
                clerkId: userId
            }
        })

        if(existingUser){
            return existingUser;
        }

        const dbUser = await prisma.user.create({
            data:{
                clerkId: userId,
                name: `${user.firstName||""} ${user.lastName||""}`,
                username: user.username || user.emailAddresses[0].emailAddress.split('@')[0],
                email: user.emailAddresses[0].emailAddress,
                image: user.imageUrl,
            }
        })

        return dbUser;
    } catch (error) {
        console.log("Error sync user", error);
    }
}

export async function gettUserByClerkId(clerkId:string){
    try {
        const user = await prisma.user.findUnique({
            where:{
                clerkId,
            },
            include:{
                _count:{
                    select:{
                        followers:true,
                        following:true,
                        posts:true,
                    },
                },
            }
        });
        return user;
    } catch (error) {
        console.log("Error get user by clerkId", error);
    }

}

export async function getDbUserId(){
    const {userId:clerkId} = await auth();
    if(!clerkId){
       return null;
    }

    const user = await gettUserByClerkId(clerkId);

    if(!user){
        throw new Error("User not found");
    }
    return user.id;
}

export async function getRandomUsers(){
    try {
        const userId = await getDbUserId();

        if(!userId){
            return [];
        }

        const randomusers = await prisma.user.findMany({
            where:{
                AND:[
                    {NOT:{id:userId},},
                    {NOT:{followers:{some:{followerId:userId}}}},
                ]
            },
            select:{
                id:true,
                name:true,
                username:true,
                image:true,
                _count:{
                    select:{
                        followers:true,
                    }
                }
            },
            take: 3,
        })
        
        return randomusers;
    } catch (error) {
        console.log("Error get random users", error);
        return [];
    }
}

export async function ToggleFollow(targetUserId:string){
    try {
        const userId = await getDbUserId();

        if(!userId){
            return;
        }

        if(userId===targetUserId){
            throw new Error("You can't follow yourself");
        }

        const existingFollow = await prisma.follows.findUnique({
            where:{
                followerId_followingId:{
                    followerId:userId,
                    followingId:targetUserId
                }
            }
        })

        if(existingFollow){
            await prisma.follows.delete({
                where:{
                    followerId_followingId:{
                        followerId:userId,
                        followingId:targetUserId
                    }
                }
            })
        }else{
            await prisma.$transaction([
                prisma.follows.create({
                    data:{
                        followerId:userId,
                        followingId:targetUserId
                    }
                }),

                prisma.notification.create({
                    data:{
                        userId:targetUserId,
                        creatorId:userId,
                        type:"FOLLOW"
                    }
                }),
            ]);
        }

        revalidatePath("/");

        return {success: true};
    } catch (error) {
        console.log("Error follow user", error);
        return {success: false, Error: "Error toggling follow"};
    }
}
