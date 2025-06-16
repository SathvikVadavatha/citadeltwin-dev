
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, Mail, MessageCircle } from 'lucide-react';

const Support: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Support Center</h1>
        <p className="text-muted-foreground mt-2">Get help with CitadelTwin</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ
            </CardTitle>
            <CardDescription>
              Find answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Browse our frequently asked questions for quick answers.</p>
            <Button className="mt-4" variant="outline">View FAQ</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Live Chat
            </CardTitle>
            <CardDescription>
              Chat with our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Get real-time help from our support specialists.</p>
            <Button className="mt-4">Start Chat</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Support
          </CardTitle>
          <CardDescription>
            Send us a message and we'll get back to you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Your email" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="What's this about?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Describe your issue or question" rows={4} />
          </div>
          <Button>Send Message</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Support;
