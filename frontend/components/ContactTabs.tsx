"use client";

import { useState } from "react";
import { EnquiryForm } from "./EnquiryForm";
import { ContactForm } from "./ContactForm";
import { FiHome, FiMail } from "react-icons/fi";

export function ContactTabs() {
  const [activeTab, setActiveTab] = useState<"enquiry" | "general">("enquiry");

  return (
    <div>
      <div className="flex border-b border-[#DED5C7] mb-8 gap-4">
        <button
          onClick={() => setActiveTab("enquiry")}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all duration-200 ${
            activeTab === "enquiry"
              ? "border-[#586348] text-[#586348]"
              : "border-transparent text-[#788278] hover:text-[#242824]"
          }`}
        >
          <FiHome size={15} />
          <span>Project Consultation</span>
        </button>
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all duration-200 ${
            activeTab === "general"
              ? "border-[#586348] text-[#586348]"
              : "border-transparent text-[#788278] hover:text-[#242824]"
          }`}
        >
          <FiMail size={15} />
          <span>Quick Note</span>
        </button>
      </div>

      {activeTab === "enquiry" ? <EnquiryForm /> : <ContactForm />}
    </div>
  );
}
