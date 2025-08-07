import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | BusinessSathi",
};

const policy = [
  {
    title: "Introduction",
    description:
      'At BusinessSathi, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website businesssathi.vercel.app and use our services.',
  },
  {
    title: "Information We Collect",
    description: "We may collect the following types of information:",
    keyPointsWTitle: [
      {
        keyTitle: "Personal Information:",
        keyDescription: "Name, email, phone number, business details.",
      },
      {
        keyTitle: "Usage Data:",
        keyDescription:
          "Browser type, IP address, pages visited, time spent on pages.",
      },
      {
        keyTitle: "Cookies & Tracking Technologies:",
        keyDescription: "To enhance user experience and analytics.",
      },
    ],
  },

  {
    title: "How We Use Your Information",
    description: "We use the information we collect to:",
    keyPoints: [
      "Provide, maintain, and improve our services",
      "Communicate with you about your account or transactions",
      "Send you marketing communications (with your consent)",
      "Analyze usage to enhance user experience",
      "Comply with legal obligations and protect our rights",
    ],
  },
  {
    title: "Sharing Your Information",
    description:
      "We do not sell your personal information. We may share your data with:",
    keyPoints: [
      "Trusted service providers (e.g., hosting, analytics)",
      "Law enforcement, if legally required",
    ],
  },
  {
    title: "Cookies",
    description:
      "We use cookies to track user behavior and improve services. You can disable cookies through your browser settings.",
  },
  {
    title: "Data Security",
    description:
      "We implement appropriate security measures to protect your data. However, no method of transmission or storage is 100% secure.",
  },
  {
    title: "Your Rights",
    description: "Depending on your location, you may have rights such as:",
    keyPoints: [
      "Access or correction of your data",
      "Request deletion",
      "Opt-out of marketing communications",
    ],
  },
  {
    title: "Third-Party Links",
    description:
      "Our website may contain links to third-party sites. We are not responsible for their privacy practices.",
  },
  {
    title: "Changes to This Policy",
    description:
      "We may update this policy periodically. Please review it frequently for any changes.",
  },
  {
    title: "Contact Us",
    description: "If you have any questions about this policy, contact us at",
    link: {
      href: "mailto:guptaaman9036@gmail.com",
      text: "guptaaman9036@gmail.com.",
    },
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto">
      <h1 className="text-5xl lg:text-6xl font-semibold mb-10 lg:mb-16 lg:mt-6">Privacy Policy</h1>
      {policy.map((item, index) => (
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
          {item.keyPointsWTitle && item.keyPointsWTitle.length > 0 && (
            <ul className="list-disc pl-8 mt-4">
              {item.keyPointsWTitle.map((point, pointIndex) => (
                <li key={pointIndex} className="mb-2 text-xl">
                  <strong>{point.keyTitle}</strong> {point.keyDescription}
                </li>
              ))}
            </ul>
          )}
          {item.keyPoints && item.keyPoints.length > 0 && (
            <ul className="list-disc pl-8 mt-4">
              {item.keyPoints.map((point, pointIndex) => (
                <li key={pointIndex} className="mb-2 text-xl">
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
