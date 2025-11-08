import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
const articles = [
  {
    title: "Understanding Decentralized Finance in Agriculture",
    description: "Explore how blockchain and DeFi are transforming agricultural supply chains, providing new opportunities for farmers and investors.",
    category: "Technology",
  },
  {
    title: "Best Practices for Sustainable Farming",
    description: "Learn about modern techniques that improve crop yield while protecting the environment for future generations.",
    category: "Farming",
  },
  {
    title: "Navigating Global Food Crop Markets",
    description: "An analysis of current market trends, price fluctuations, and how to make informed trading decisions on the platform.",
    category: "Markets",
  },
  {
    title: "The Role of KYC in Building Trust",
    description: "Why identity verification is crucial for creating a secure and transparent agribusiness marketplace.",
    category: "Security",
  },
  {
    title: "Logistics and Supply Chain Optimization",
    description: "Tips and strategies for distributors to streamline their operations and reduce costs.",
    category: "Logistics",
  },
  {
    title: "Introduction to Agri-Tokenization",
    description: "A beginner's guide to how agricultural assets can be represented as digital tokens, unlocking liquidity and investment.",
    category: "Investment",
  },
];
export function EducationHubPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Education Hub</h1>
          <p className="mt-4 text-xl text-muted-foreground">Your resource for agribusiness knowledge and insights.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <Card key={index} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <p className="text-sm font-semibold text-primary">{article.category}</p>
                <CardTitle>{article.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{article.description}</p>
              </CardContent>
              <CardFooter>
                <Link to="#" className="flex items-center font-semibold text-sm text-primary hover:underline">
                  Read more <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}