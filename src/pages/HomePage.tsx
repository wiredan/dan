import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart, Leaf, Lock, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <Card className="text-center">
    <CardHeader>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <CardTitle className="mt-4">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);
const TestimonialCard = ({ quote, author, role }: { quote: string, author: string, role: string }) => (
  <Card className="bg-secondary border-none">
    <CardContent className="pt-6">
      <blockquote className="text-lg italic">"{quote}"</blockquote>
      <footer className="mt-4">
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
      </footer>
    </CardContent>
  </Card>
);
export function HomePage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-24 md:py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
              The Future of Agribusiness is Decentralized
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              AgriLink connects farmers, distributors, and investors on a secure, transparent platform. Trade, track, and transact with confidence.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/marketplace">Explore Market</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">A New Era of Agricultural Trade</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              Our platform is built on cutting-edge technology to ensure fairness, transparency, and efficiency.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Leaf className="w-6 h-6" />}
              title="Direct Sourcing"
              description="Connect directly with farmers to source the freshest crops without intermediaries."
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6" />}
              title="Secure Escrow"
              description="Payments are held securely in escrow and released automatically upon delivery confirmation."
            />
            <FeatureCard
              icon={<Truck className="w-6 h-6" />}
              title="Transparent Logistics"
              description="Track your orders in real-time from the farm to your warehouse with our advanced tracking system."
            />
            <FeatureCard
              icon={<BarChart className="w-6 h-6" />}
              title="Market Insights"
              description="Access real-time data and analytics to make smarter purchasing and investment decisions."
            />
          </div>
        </div>
      </section>
      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Trusted by the Community</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <TestimonialCard
              quote="AgriLink has revolutionized how I sell my produce. I get better prices and faster payments."
              author="Amina Yusuf"
              role="Farmer, Nigeria"
            />
            <TestimonialCard
              quote="The transparency and security of the platform are game-changers for our distribution network."
              author="Carlos Gomez"
              role="Distributor, Vietnam"
            />
            <TestimonialCard
              quote="As an investor, I can finally participate in the agricultural market with confidence and clarity."
              author="Fatima Al-Sayed"
              role="Investor, UAE"
            />
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary/10 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Ready to Join the Revolution?</h2>
            <p className="mt-4 text-muted-foreground">
              Create an account today and experience the future of agribusiness.
            </p>
            <div className="mt-6">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}