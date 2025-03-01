"use client"
import React from 'react'
import { Button } from './ui/button';
import { Loader2Icon } from 'lucide-react';
import { ToggleFollow } from '@/actions/user.action';
import toast from 'react-hot-toast';

function FollowButton({userId}: {userId: string}) {

    const [isLoading, setIsLoading] = React.useState(false);

    const handleFollow = async () => {

        setIsLoading(true);

        try {
            await ToggleFollow(userId);
            toast.success("User followed successfully");
        } catch (error) {
            console.log("Error follow user", error);
            toast.error("Failed to follow user");
        }finally{
            setIsLoading(false);
        }
    }
    
  return (
    <Button
        size={"sm"}
        variant={"secondary"}
        onClick={handleFollow}
        disabled={isLoading}
        className='w-20'
    >
        {isLoading ? <Loader2Icon className='size-4 animate-spin'/> : "Follow"}
    </Button>
  )
}

export default FollowButton