import { createFileRoute } from "@tanstack/react-router";
import { Settings, Bell, Lock, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Civic Bridge Flow" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    statusUpdates: true,
    chatMessages: true,
    escalations: true,
    emergencyAlerts: true,
    pushNotifications: false,
  });

  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "en",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, preferences, and notification settings</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name</Label>
              <Input id="fullname" defaultValue="Aarav Sharma" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="aarav@example.com" disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input id="mobile" defaultValue="+91 90000 00000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aadhaar">Aadhaar Number</Label>
              <Input id="aadhaar" defaultValue="XXXX XXXX 1234" disabled />
              <p className="text-xs text-muted-foreground">For security, Aadhaar is only partially visible</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input id="district" defaultValue="Gurugram" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" defaultValue="Haryana" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" defaultValue="123 Main Street, Gurgaon" />
          </div>
          <div className="flex justify-end">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Choose how and when you want to receive updates about your complaints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-alerts">Email Alerts</Label>
                <p className="text-sm text-muted-foreground">Receive email notifications for complaint updates</p>
              </div>
              <Switch
                id="email-alerts"
                checked={notifications.emailAlerts}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailAlerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="status-updates">Status Updates</Label>
                <p className="text-sm text-muted-foreground">Get notified when your complaint status changes</p>
              </div>
              <Switch
                id="status-updates"
                checked={notifications.statusUpdates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, statusUpdates: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="chat-messages">Chat Messages</Label>
                <p className="text-sm text-muted-foreground">Get notified when officers or admins send you messages</p>
              </div>
              <Switch
                id="chat-messages"
                checked={notifications.chatMessages}
                onCheckedChange={(checked) => setNotifications({ ...notifications, chatMessages: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="escalations">Escalation Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when complaints are escalated</p>
              </div>
              <Switch
                id="escalations"
                checked={notifications.escalations}
                onCheckedChange={(checked) => setNotifications({ ...notifications, escalations: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emergency">Emergency Alerts</Label>
                <p className="text-sm text-muted-foreground">Always get critical emergency notifications (cannot be disabled)</p>
              </div>
              <Switch id="emergency" checked={notifications.emergencyAlerts} disabled />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Enable push notifications on your device</p>
              </div>
              <Switch
                id="push"
                checked={notifications.pushNotifications}
                onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your SmartGov experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                value={preferences.theme}
                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="pa">ਪੰਜਾਬੀ</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">Save Preferences</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription className="text-orange-800">Manage your account security and sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full md:w-auto">
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full md:w-auto">
            Enable Two-Factor Authentication
          </Button>
          <div className="rounded border border-orange-200 bg-white p-4 text-sm">
            <p className="font-semibold text-orange-900">Active Sessions</p>
            <p className="text-muted-foreground text-xs mt-2">1 active session on Chrome/Windows</p>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Logout</CardTitle>
          <CardDescription className="text-red-800">Sign out from your SmartGov account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full md:w-auto">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
