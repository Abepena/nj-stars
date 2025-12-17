"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  ChevronLeft,
  Circle,
} from "lucide-react"
import Link from "next/link"

// Types for our chat system
interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: "parent" | "coach"
  content: string
  timestamp: Date
  read: boolean
}

interface ChatParticipant {
  id: string
  name: string
  role: "parent" | "coach"
  avatar?: string
  isOnline: boolean
}

// Simulated data
const CURRENT_USER: ChatParticipant = {
  id: "parent-1",
  name: "John Smith",
  role: "parent",
  isOnline: true,
}

const COACH: ChatParticipant = {
  id: "coach-1",
  name: "Coach Williams",
  role: "coach",
  isOnline: true,
}

// Initial messages to demonstrate the chat
const getInitialMessages = (): Message[] => [
  {
    id: "1",
    senderId: "coach-1",
    senderName: "Coach Williams",
    senderRole: "coach",
    content: "Hi! Thanks for reaching out about Marcus's progress.",
    timestamp: new Date(Date.now() - 3600000 * 2),
    read: true,
  },
  {
    id: "2",
    senderId: "parent-1",
    senderName: "John Smith",
    senderRole: "parent",
    content: "Hi Coach! Yes, I wanted to check in on how he's doing at practice.",
    timestamp: new Date(Date.now() - 3600000 * 1.5),
    read: true,
  },
  {
    id: "3",
    senderId: "coach-1",
    senderName: "Coach Williams",
    senderRole: "coach",
    content: "Marcus has been doing great! His ball handling has improved significantly over the past few weeks. He's also showing good leadership on the court.",
    timestamp: new Date(Date.now() - 3600000),
    read: true,
  },
  {
    id: "4",
    senderId: "parent-1",
    senderName: "John Smith",
    senderRole: "parent",
    content: "That's wonderful to hear! He's been practicing at home too.",
    timestamp: new Date(Date.now() - 1800000),
    read: true,
  },
  {
    id: "5",
    senderId: "coach-1",
    senderName: "Coach Williams",
    senderRole: "coach",
    content: "It shows! Keep up the good work. Also, don't forget about the tournament next Saturday. Make sure he gets good rest the night before.",
    timestamp: new Date(Date.now() - 900000),
    read: true,
  },
]

// Simulated coach responses
const COACH_RESPONSES = [
  "That's a great question! Let me think about that...",
  "Absolutely! I'll make sure to work on that with Marcus.",
  "Thanks for letting me know. I appreciate the communication!",
  "I'll send you the details about that shortly.",
  "Great idea! We can definitely incorporate that into practice.",
  "The team is really coming together. Marcus is a big part of that!",
]

export default function ChatExamplePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize messages on client
  useEffect(() => {
    setMessages(getInitialMessages())
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    // Add parent's message
    const parentMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      senderRole: "parent",
      content: newMessage,
      timestamp: new Date(),
      read: false,
    }

    setMessages((prev) => [...prev, parentMessage])
    setNewMessage("")
    inputRef.current?.focus()

    // Simulate coach typing
    setIsTyping(true)

    // Simulate coach response after a delay
    setTimeout(() => {
      setIsTyping(false)
      const randomResponse = COACH_RESPONSES[Math.floor(Math.random() * COACH_RESPONSES.length)]
      const coachMessage: Message = {
        id: `msg-${Date.now()}-coach`,
        senderId: COACH.id,
        senderName: COACH.name,
        senderRole: "coach",
        content: randomResponse,
        timestamp: new Date(),
        read: false,
      }
      setMessages((prev) => [...prev, coachMessage])
    }, 1500 + Math.random() * 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDateDivider = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
    return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })
  }

  return (
    <div className="h-[calc(100vh-12rem)] max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>

      <Card className="h-full flex flex-col">
        {/* Chat Header */}
        <CardHeader className="border-b px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    CW
                  </AvatarFallback>
                </Avatar>
                {COACH.isOnline && (
                  <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  {COACH.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    Coach
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {COACH.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {/* Date divider */}
              {messages.length > 0 && (
                <div className="flex items-center justify-center">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {formatDateDivider(messages[0]?.timestamp || new Date())}
                  </span>
                </div>
              )}

              {/* Messages */}
              {messages.map((message, index) => {
                const isCurrentUser = message.senderId === CURRENT_USER.id
                const showAvatar =
                  index === 0 ||
                  messages[index - 1].senderId !== message.senderId

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${
                      isCurrentUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && !isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            CW
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isCurrentUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-end gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      CW
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            This is a demo chat. Messages are simulated locally.
          </p>
        </div>
      </Card>
    </div>
  )
}
