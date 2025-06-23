'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Bot, Bell, Shield, Palette } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Settings</DialogTitle>
          <DialogDescription className="text-white/70">
            Configure your agent settings and preferences
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10">
            <TabsTrigger value="general" className="data-[state=active]:bg-purple-500/20">
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-purple-500/20">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-purple-500/20">
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-purple-500/20">
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="agent-name" className="text-white">Agent Name</Label>
                <Input 
                  id="agent-name" 
                  defaultValue="My Agent" 
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div>
                <Label htmlFor="response-delay" className="text-white">Response Delay (seconds)</Label>
                <Input 
                  id="response-delay" 
                  type="number" 
                  defaultValue="0.5" 
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Auto-respond</Label>
                  <p className="text-white/70 text-sm">Automatically respond to common queries</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Email Notifications</Label>
                  <p className="text-white/70 text-sm">Receive email alerts for important events</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Push Notifications</Label>
                  <p className="text-white/70 text-sm">Browser push notifications</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Daily Reports</Label>
                  <p className="text-white/70 text-sm">Daily summary of agent activity</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-key" className="text-white">API Key</Label>
                <Input 
                  id="api-key" 
                  type="password" 
                  placeholder="••••••••••••••••" 
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Two-Factor Authentication</Label>
                  <p className="text-white/70 text-sm">Add an extra layer of security</p>
                </div>
                <Switch />
              </div>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Revoke All Sessions
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Dark Mode</Label>
                  <p className="text-white/70 text-sm">Use dark theme</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Compact Layout</Label>
                  <p className="text-white/70 text-sm">Use more compact spacing</p>
                </div>
                <Switch />
              </div>
              <div>
                <Label className="text-white">Theme Color</Label>
                <div className="flex space-x-2 mt-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white cursor-pointer"></div>
                  <div className="w-8 h-8 rounded-full bg-blue-500 border border-white/20 cursor-pointer"></div>
                  <div className="w-8 h-8 rounded-full bg-green-500 border border-white/20 cursor-pointer"></div>
                  <div className="w-8 h-8 rounded-full bg-red-500 border border-white/20 cursor-pointer"></div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-white/20 text-white hover:bg-white/10 bg-slate-800/50"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
