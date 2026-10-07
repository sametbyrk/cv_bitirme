import Link from "next/link";
import { ArrowRight, CheckCircle, Sparkles, FileText, Layout } from "lucide-react";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              <FileText className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900">CV Maker</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-blue-600 hover:text-blue-800 font-bold text-lg">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <Sparkles size={16} />
            <span>The #1 AI Resume Builder</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
            The smartest way to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              build your resume.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10">
            Create ATS-optimizable resumes that get you hired at top companies.
            Powered by AI to write your content in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Create My Resume <ArrowRight size={20} />
            </Link>
            <Link href="/examples" className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-200 transition flex items-center justify-center">
              View Examples
            </Link>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Why use our Resume Builder?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Writer</h3>
              <p className="text-gray-600">
                Stop struggling with words. Our AI writes professional bullet points for your experience in seconds.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">ATS Targeted</h3>
              <p className="text-gray-600">
                Beat the bots. We analyze job descriptions and optimize your resume keywords to pass ATS filters.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Layout size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Preview</h3>
              <p className="text-gray-600">
                See changes instantly. No more guessing how your PDF will look. What you see is what you get.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
