MVP Moderation & Safety Plan (Supabase)
This document provides a focused, technical blueprint for implementing the core user-reporting feature for manual moderation using your Supabase stack.

Part 1: Finalized MVP Database Schema
These are the precise SQL commands to set up your database tables for the MVP. You can run these directly in the Supabase SQL Editor.

1. Create a User Role Type (For Security)

Using a PostgreSQL enum is more secure and robust than a plain text field. It ensures that the role column can only contain values from this predefined list.

CREATE TYPE public.user_role AS ENUM (
  'free',
  'vip',
  'boost',
  'mod',
  'admin'
);

2. profiles Table (Altered for MVP)

We'll add the role and times_reported columns. I've used times_reported as it's a common convention, based on your user_reports idea.

ALTER TABLE public.profiles
ADD COLUMN role public.user_role NOT NULL DEFAULT 'free',
ADD COLUMN times_reported integer NOT NULL DEFAULT 0;

3. reports Table (Simplified for MVP)

This is the streamlined version of the case file table, removing the fields we're deferring.

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'PENDING', -- PENDING, REVIEWED, ACTION_TAKEN
  reporting_user_id uuid NOT NULL REFERENCES public.profiles(id),
  reported_user_id uuid NOT NULL REFERENCES public.profiles(id),
  chat_log jsonb, -- Stores the last 10 messages
  evidence_url text -- Public URL from your 'reported-images' bucket
);

-- Add indexes for faster queries in your moderation dashboard
CREATE INDEX ON public.reports (status);
CREATE INDEX ON public.reports (reported_user_id);

Part 2: The MVP Reporting Pipeline (End-to-End Flow)
This is the step-by-step technical guide to making the report button functional.

Step 2.1: Client-Side Evidence Capture (page.tsx)

When a user clicks the <Flag /> button, this function gathers all the necessary evidence.

// Function inside your WatchPage component
const handleReport = async () => {
  if (!strangerVideoRef.current || !partnerId) {
    console.error("Cannot report: No partner connected.");
    return;
  }

  const video = strangerVideoRef.current;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Get the last 10 chat messages from your state
  const recentMessages = chatMessages.slice(-10);

  canvas.toBlob((blob) => {
    if (blob) {
      // Send all evidence to the server to start the reporting process
      socket.emit('initiate-report', { 
        partnerId, 
        screenshot: blob,
        chatLog: { messages: recentMessages }
      });
    }
  }, 'image/jpeg', 0.7); // Use JPEG for smaller file size
};

Step 2.2: Server-Side Logic (server.ts)

The server's role is minimal and secure: it receives the request and immediately terminates the chat to protect the reporter. It does not handle file uploads or database writes.

// Inside your io.on('connection', (socket) => { ... });

socket.on('initiate-report', async ({ partnerId, screenshot, chatLog }) => {
  const user = users.get(socket.id);
  const partner = users.get(partnerId);

  if (!user || !partner || !user.persistentId || !partner.persistentId) return;

  // 1. Immediately terminate the chat
  io.to(partnerId).emit('partner-disconnected');
  io.to(socket.id).emit('partner-disconnected');
  // ... (add your room cleanup logic here) ...

  // 2. Invoke a Supabase Edge Function to handle the report.
  // This is more robust and scalable.
  const { data, error } = await supabase.functions.invoke('create-report-mvp', {
    body: {
      reportingUserId: user.persistentId,
      reportedUserId: partner.persistentId,
      // Convert the ArrayBuffer from the client to base64 to send to the function
      screenshotBase64: Buffer.from(screenshot).toString('base64'),
      chatLog: chatLog
    }
  });

  if (error) {
    console.error('Error invoking create-report-mvp function:', error);
    // Optionally, inform the user that the report failed
    io.to(socket.id).emit('report-failed');
  } else {
    // Inform the user the report was successful
    io.to(socket.id).emit('report-successful');
  }
});

Step 2.3: Supabase Edge Function: create-report-mvp

This is the core of the backend logic. This function uploads the image to your reported-images bucket, creates the report record, and increments the counter on the user's profile.

// supabase/functions/create-report-mvp/index.ts

import { createClient } from '@supabase/supabase-js'
import { Buffer } from 'https://deno.land/std@0.150.0/node/buffer.ts';
import { v4 as uuidv4 } from 'https://deno.land/std@0.150.0/uuid/mod.ts';

// Create a Supabase client with the service_role key to bypass RLS for this trusted function
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    const { reportingUserId, reportedUserId, screenshotBase64, chatLog } = await req.json();
    
    const caseId = uuidv4();
    const filePath = `${reportedUserId}/${caseId}.jpeg`; // Organize images by reported user's ID

    // 1. Decode and upload the image to your 'reported-images' bucket
    const { error: uploadError } = await supabaseAdmin.storage
      .from('reported-images')
      .upload(filePath, Buffer.from(screenshotBase64, 'base64'), {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 2. Get the public URL of the uploaded file
    const { data: urlData } = supabaseAdmin.storage.from('reported-images').getPublicUrl(filePath);

    // 3. Create the report record in the database
    const { error: reportError } = await supabaseAdmin.from('reports').insert({
      reporting_user_id: reportingUserId,
      reported_user_id: reportedUserId,
      chat_log: chatLog,
      evidence_url: urlData.publicUrl
    });

    if (reportError) throw reportError;

    // 4. Atomically increment the 'times_reported' counter on the profile
    // Using an RPC function is the safest way to handle concurrent increments.
    const { error: rpcError } = await supabaseAdmin.rpc('increment_times_reported', { 
      user_id: reportedUserId 
    });

    if (rpcError) throw rpcError;

    return new Response(JSON.stringify({ success: true, caseId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

Step 2.4: Create the RPC Function in Supabase

This simple SQL function ensures that you never have race conditions when incrementing the report counter. Run this in your Supabase SQL Editor.

CREATE OR REPLACE FUNCTION increment_times_reported(user_id uuid)
RETURNS void AS $$
  UPDATE public.profiles
  SET times_reported = times_reported + 1
  WHERE id = user_id;
$$ LANGUAGE sql;

This MVP plan gives you a robust, secure, and production-ready system for user reporting, laying the perfect groundwork for your manual moderation dashboard.