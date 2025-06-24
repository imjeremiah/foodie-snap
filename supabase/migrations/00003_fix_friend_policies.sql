-- Fix friend request policies to allow recipients to accept requests

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can manage their friend requests" ON public.friends;

-- Create separate policies for different operations

-- Users can send friend requests (INSERT)
CREATE POLICY "Users can send friend requests" ON public.friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sent requests (for canceling, etc.)
CREATE POLICY "Users can update sent requests" ON public.friends
  FOR UPDATE USING (auth.uid() = user_id);

-- Recipients can accept/reject incoming friend requests
CREATE POLICY "Users can respond to friend requests" ON public.friends
  FOR UPDATE USING (auth.uid() = friend_id AND status = 'pending');

-- Users can delete their own friend relationships
CREATE POLICY "Users can delete friend relationships" ON public.friends
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id); 