"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, Mail, MessageSquare, Phone } from "lucide-react"
import { useState } from "react"
import { SiteNav } from "@/components/site-nav"

export default function HelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const faqData = [
    {
      id: "account",
      question: "How do I create an account?",
      answer:
        "To create an account, click the 'Sign Up' button in the top right corner of the homepage. Fill in your email, create a password, and verify your email address through the confirmation link we'll send you.",
    },
    {
      id: "billing",
      question: "How does billing work?",
      answer:
        "We offer monthly and annual subscription plans. You'll be charged automatically on your billing date. You can view and manage your billing information in your account settings under the 'Billing' tab.",
    },
    {
      id: "tasks",
      question: "How do I organize my tasks by color?",
      answer:
        "Task-ette uses an intelligent color-coding system. Tasks are automatically categorized by urgency and type: Red/Orange for urgent tasks, Blue for analytical work, Purple for creative projects, Green for collaborative tasks, and Yellow for routine maintenance.",
    },
    {
      id: "sync",
      question: "Can I sync across multiple devices?",
      answer:
        "Yes! Your tasks automatically sync across all your devices when you're logged in. Changes made on one device will appear on all others within seconds.",
    },
    {
      id: "export",
      question: "Can I export my tasks?",
      answer:
        "You can export your tasks in multiple formats including CSV, PDF, and JSON. Go to Settings > Data Export to download your task history and current projects.",
    },
    {
      id: "password",
      question: "I forgot my password. How do I reset it?",
      answer:
        "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a secure reset link. The link expires after 24 hours for security.",
    },
    {
      id: "delete",
      question: "How do I delete my account?",
      answer:
        "To delete your account, go to Settings > Account > Delete Account. This action is permanent and will remove all your data. We recommend exporting your tasks first.",
    },
    {
      id: "mobile",
      question: "Is there a mobile app?",
      answer:
        "Task-ette works perfectly in your mobile browser with a responsive design. We're currently developing native iOS and Android apps - join our newsletter for updates!",
    },
  ]

  const filteredFAQs = faqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <SiteNav />
      {/* Header Section */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-950 to-slate-950"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-800/40 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-purple-700/30 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto relative">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Help & Support
              </span>
            </h1>
            <p className="text-xl text-stone-300 leading-relaxed max-w-2xl mx-auto mb-8">
              Find answers to your questions or get in touch with our support team.
            </p>

            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search our FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-stone-800/50 border-stone-700 text-white placeholder-stone-400 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-white">Frequently Asked </span>
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>

          <Card className="bg-stone-800/30 border-stone-700/30">
            <CardContent className="p-6">
              <Accordion type="multiple" className="w-full">
                {filteredFAQs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border-stone-700/50">
                    <AccordionTrigger className="text-left text-white hover:text-blue-400 transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-stone-300 leading-relaxed">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {filteredFAQs.length === 0 && searchQuery && (
                <div className="text-center py-8 text-stone-400">
                  No FAQs found matching "{searchQuery}". Try a different search term or contact support below.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative py-16 px-4 bg-gradient-to-br from-stone-900/50 to-stone-800/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">Still Need Help?</h2>
            <p className="text-xl text-stone-300">Choose how you'd like to get in touch with our support team.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Email Support */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
              <CardHeader className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-2">📧 Email Support</CardTitle>
                <CardDescription className="text-stone-300 mb-4">Get detailed help within 24 hours</CardDescription>
                <Button
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 w-full"
                  onClick={() => (window.location.href = "mailto:support@task-ette.com?subject=Support Request")}
                >
                  Send Email
                </Button>
              </CardHeader>
            </Card>

            {/* Live Chat */}
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40 transition-all duration-300">
              <CardHeader className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-2">💬 Live Chat</CardTitle>
                <CardDescription className="text-stone-300 mb-4">Chat with us Mon-Fri, 9AM-6PM EST</CardDescription>
                <Button
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 w-full"
                  onClick={() => {
                    // Placeholder for live chat integration
                    alert("Live chat will open here")
                  }}
                >
                  Start Chat
                </Button>
              </CardHeader>
            </Card>

            {/* Request Callback */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
              <CardHeader className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-2">📞 Request a Callback</CardTitle>
                <CardDescription className="text-stone-300 mb-4">We'll call you back within 2 hours</CardDescription>
                <Button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 w-full"
                  onClick={() => {
                    // Placeholder for callback request form
                    alert("Callback request form will open here")
                  }}
                >
                  Request Callback
                </Button>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
