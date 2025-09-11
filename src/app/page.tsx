import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Users, Brain, Palette, Star, Zap, Heart, Coffee } from "lucide-react"
import { ProfileMenu } from "@/components/profile-menu"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-white overflow-hidden">
      <ProfileMenu />

      <section className="relative pt-24 md:pt-32 pb-16 md:pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-950 to-slate-950"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-32 h-32 bg-stone-800/40 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-stone-700/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-stone-800/50 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-orange-300 border-orange-500/30">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Mood Magic
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-pink-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent [&]:text-pink-400">
                  Tasks with
                </span>
                <br />
                <span className="text-white">Personality</span>
              </h1>

              <p className="text-xl text-stone-300 leading-relaxed max-w-lg">
                Transform boring task lists into vibrant moodboards. Our AI reads between the lines to assign colors,
                moods, and team members that match your project's energy.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500 hover:from-pink-600 hover:via-violet-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-violet-500/25"
                >
                  Create Your First Moodboard <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-stone-600 text-white hover:bg-stone-800/50 bg-transparent"
                >
                  Watch the Magic
                </Button>
              </div>
            </div>

            <div className="relative h-80 sm:h-96 lg:h-[500px] hidden md:block">
              {/* Energetic Task */}
              <Card className="absolute top-0 right-0 w-64 bg-gradient-to-br from-orange-500/90 to-red-500/90 border-0 text-white transform rotate-3 hover:rotate-6 transition-transform duration-300 shadow-xl shadow-orange-500/25">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5" />
                    <Badge className="bg-white/20 text-white text-xs">URGENT</Badge>
                  </div>
                  <CardTitle className="text-lg">Launch Campaign</CardTitle>
                  <CardDescription className="text-orange-100">
                    High-energy marketing push for Q4 launch
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-6 h-6 bg-white/30 rounded-full"></div>
                    <div className="w-6 h-6 bg-white/30 rounded-full"></div>
                    <span className="text-xs text-orange-100">+3 more</span>
                  </div>
                </CardHeader>
              </Card>

              {/* Calm Task */}
              <Card className="absolute top-20 left-0 w-60 bg-gradient-to-br from-blue-500/90 to-cyan-500/90 border-0 text-white transform -rotate-2 hover:-rotate-4 transition-transform duration-300 shadow-xl shadow-blue-500/25">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5" />
                    <Badge className="bg-white/20 text-white text-xs">PLANNING</Badge>
                  </div>
                  <CardTitle className="text-lg">Strategy Review</CardTitle>
                  <CardDescription className="text-blue-100">Thoughtful analysis of user feedback</CardDescription>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-6 h-6 bg-white/30 rounded-full"></div>
                    <span className="text-xs text-blue-100">Sarah M.</span>
                  </div>
                </CardHeader>
              </Card>

              {/* Creative Task */}
              <Card className="absolute bottom-0 right-8 w-56 bg-gradient-to-br from-purple-500/90 to-pink-500/90 border-0 text-white transform rotate-1 hover:rotate-3 transition-transform duration-300 shadow-xl shadow-purple-500/25">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-5 h-5" />
                    <Badge className="bg-white/20 text-white text-xs">CREATIVE</Badge>
                  </div>
                  <CardTitle className="text-lg">Design System</CardTitle>
                  <CardDescription className="text-purple-100">Craft beautiful, cohesive UI components</CardDescription>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-6 h-6 bg-white/30 rounded-full"></div>
                    <div className="w-6 h-6 bg-white/30 rounded-full"></div>
                    <span className="text-xs text-purple-100">Design Team</span>
                  </div>
                </CardHeader>
              </Card>

              {/* Collaborative Task */}
              <Card className="absolute bottom-16 left-12 w-52 bg-gradient-to-br from-green-500/90 to-emerald-500/90 border-0 text-white transform -rotate-1 hover:-rotate-2 transition-transform duration-300 shadow-xl shadow-green-500/25">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5" />
                    <Badge className="bg-white/20 text-white text-xs">TEAM</Badge>
                  </div>
                  <CardTitle className="text-lg">Sprint Planning</CardTitle>
                  <CardDescription className="text-green-100">Collaborative roadmap session</CardDescription>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-6 h-6 bg-white/30 rounded-full"></div>
                    <div className="w-6 h-6 bg-white/30 rounded-full"></div>
                    <div className="w-6 h-6 bg-white/30 rounded-full"></div>
                    <span className="text-xs text-green-100">Everyone</span>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 px-4 bg-gradient-to-br from-stone-900 to-stone-800 transform -skew-y-1">
        <div className="transform skew-y-1">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent [&]:text-yellow-400">
                  Every Mood
                </span>
                <span className="text-white"> Has Its Color</span>
              </h2>
              <p className="text-xl text-stone-300 max-w-3xl mx-auto leading-relaxed">
                Our AI doesn't just organize tasks—it feels them. Watch as your workflow transforms into a living,
                breathing canvas of productivity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Urgent & Energetic</CardTitle>
                  <CardDescription className="text-stone-300">
                    Red and orange tasks demand immediate attention. Perfect for deadlines and high-impact work.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Calm & Analytical</CardTitle>
                  <CardDescription className="text-stone-300">
                    Blue tasks promote deep thinking and strategic planning. Ideal for research and analysis.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Creative & Inspiring</CardTitle>
                  <CardDescription className="text-stone-300">
                    Purple and pink spark innovation and artistic thinking. Perfect for design and brainstorming.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Collaborative & Growth</CardTitle>
                  <CardDescription className="text-stone-300">
                    Green represents teamwork and steady progress. Great for meetings and long-term projects.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/30 hover:from-yellow-500/30 hover:to-amber-500/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Coffee className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Warm & Approachable</CardTitle>
                  <CardDescription className="text-stone-300">
                    Yellow tasks feel friendly and accessible. Perfect for onboarding and routine maintenance.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border-indigo-500/30 hover:from-indigo-500/30 hover:to-violet-500/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Premium & Important</CardTitle>
                  <CardDescription className="text-stone-300">
                    Deep purples signal high-value work that deserves special attention and careful execution.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="relative py-12 md:py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-cyan-500/5"></div>
        <div className="container mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              See the{" "}
              <span className="bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent [&]:text-pink-400">
                Magic
              </span>{" "}
              in Action
            </h2>
            <p className="text-xl text-stone-300 max-w-2xl mx-auto">
              Watch how a simple sentence becomes a beautifully organized, color-coded task with smart team assignments.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl p-8 border border-stone-700/30">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-stone-400 text-sm ml-4">Task-ette AI Processing...</span>
                </div>
                <div className="bg-stone-900 rounded-lg p-4 font-mono text-green-400 text-lg">
                  "We need to redesign the user dashboard to be more intuitive and launch it before the big client demo
                  next Friday"
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 text-stone-400">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                  <span className="ml-2">AI analyzing mood, urgency, and team fit...</span>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-orange-500/90 to-red-500/90 border-0 text-white">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      <Badge className="bg-white/20 text-white">HIGH ENERGY</Badge>
                      <Badge className="bg-white/20 text-white">URGENT</Badge>
                    </div>
                    <span className="text-sm text-orange-100">Due: Next Friday</span>
                  </div>
                  <CardTitle className="text-xl mb-2">Dashboard Redesign & Launch</CardTitle>
                  <CardDescription className="text-orange-100 mb-4">
                    High-priority UX overhaul with tight deadline - requires focused design sprint and rapid iteration.
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-xs font-bold">
                        JD
                      </div>
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-xs font-bold">
                        SM
                      </div>
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-xs font-bold">
                        AL
                      </div>
                      <span className="text-sm text-orange-100 ml-2">Design Team</span>
                    </div>
                    <div className="text-sm text-orange-100">
                      <Heart className="w-4 h-4 inline mr-1" />
                      Energetic mood detected
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 px-4 overflow-hidden">
        <div className="container mx-auto text-center relative">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            <span className="text-white">Ready to Add</span>
            <br />
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 via-cyan-400 to-green-400 bg-clip-text text-transparent [&]:text-pink-400">
              Color to Your Workflow?
            </span>
          </h2>
          <p className="text-xl text-stone-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of teams who've discovered that the right mood makes all the difference. Start your colorful
            journey today.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white border-0 shadow-2xl shadow-purple-500/25 px-8 py-4 text-lg"
            >
              Start Your Free Trial <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-stone-600 text-white hover:bg-stone-800/50 px-8 py-4 text-lg bg-transparent"
            >
              Book a Demo
            </Button>
          </div>

          <p className="text-stone-400 text-sm mt-6">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      <footer className="border-t border-stone-700/50 bg-stone-900/50 backdrop-blur-sm py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Task-ette</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-stone-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-stone-700/50 text-center text-sm text-stone-400">
            © 2025 Task-ette. Made with for creative teams everywhere.
          </div>
        </div>
      </footer>
    </div>
  )
}
