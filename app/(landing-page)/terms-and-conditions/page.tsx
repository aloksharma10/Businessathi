import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions | BusinessSathi",
};

const termsAndConditons = [
  {
    title: "",
    description:
      "Welcome to BusinessSathi. These Terms and Conditions govern your use of our website and services. By accessing or using our website, you agree to be bound by these terms.",
  },
  {
    title: "Use of Website",
    description:
      "You agree to use the website only for lawful purposes and must not misuse our services or try to access unauthorized areas.",
  },
  {
    title: "Services",
    description:
      "BusinessSathi provides business management solutions designed to help users streamline their operations, including:",
    keyPoints: [
      "GST and Non-GST Billing",
      "Inventory Management and Daily Business Entries",
      "Basic Business Insights and Reporting",
      "Multi-Format Data Export (PDF, CSV, XLSX)",
    ],
    note: "Usage of these services is subject to applicable terms. Features may evolve with updates, and certain functionalities may require compliance with relevant tax and data regulations.",
  },
  {
    title: "Intellectual Property",
    description:
      "All content on this website (texts, logos, graphics, etc.) is the property of BusinessSathi unless otherwise stated. You may not copy, distribute, or reproduce any content without written permission.",
  },
  {
    title: "Payments and Refunds",
    description:
      "All payments for services are subject to the agreed-upon terms in the service contract. We may not offer refunds once a project has started unless otherwise stated.",
  },
  {
    title: "Limitation of Liability",
    description: "BusinessSathi is not liable for:",
    keyPoints: [
      "Any indirect or consequential loss",
      "Third-party service failures",
      "Errors or interruptions in service delivery caused by factors beyond our control",
    ],
  },
  {
    title: "Termination",
    description:
      "We reserve the right to suspend or terminate access to our services or website if you violate these terms.",
  },
  {
    title: "Modifications",
    description:
      "We may update these terms at any time. Continued use of the site after changes implies your acceptance of the updated terms.",
  },
  {
    title: "Governing Law",
    description:
      "These terms shall be governed by and interpreted in accordance with the laws of Indian Government.",
  },
  {
    title: "Contact Information",
    description: "For any queries or disputes, contact us at",
    link: {
      href: "mailto:guptaaman9036@gmail.com",
      text: "guptaaman9036@gmail.com.",
    },
  },
];

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto">
      <h1 className="text-5xl lg:text-6xl font-semibold mb-10 lg:mb-16 lg:mt-6">
        Terms and Conditions
      </h1>
      {termsAndConditons.map((item, index) => (
        <div key={index} className="space-y-4 my-10">
          <h2 className="text-3xl font-semibold">{item.title}</h2>
          <p className="text-xl">
            {item.description}
            {item.link && (
              <Link
                href={item.link.href}
                className="ml-2 underline hover:text-gray-400"
              >
                {item.link.text}
              </Link>
            )}
          </p>
          {item.keyPoints && item.keyPoints.length > 0 && (
            <ul className="list-disc pl-8 mt-4">
              {item.keyPoints.map((point, pointIndex) => (
                <li key={pointIndex} className="mb-2 text-xl">
                  {point}
                </li>
              ))}
            </ul>
          )}
          {item.note && <p className="text-xl italic mt-2">{item.note}</p>}
        </div>
      ))}
    </div>
  );
}
