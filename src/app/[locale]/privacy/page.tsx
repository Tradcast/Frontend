"use client";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

export default function PrivacyPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("privacy");
  const tc = useTranslations("common");

  return (
    <main className="flex flex-col min-h-screen bg-[#ebeff2] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-24 left-4 opacity-25" width="50" height="110" viewBox="0 0 50 110">
          <line x1="15" y1="10" x2="15" y2="25" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="25" width="12" height="40" rx="2" fill="#bdecf6"/>
          <line x1="15" y1="65" x2="15" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <svg className="absolute top-32 right-6 opacity-30" width="40" height="90" viewBox="0 0 40 90">
          <line x1="20" y1="5" x2="20" y2="20" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="14" y="20" width="12" height="45" rx="2" fill="#bdecf6"/>
          <line x1="20" y1="65" x2="20" y2="80" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-800 transition-all duration-300 shadow-card"
      >
        <BackIcon />
        <span className="text-sm font-medium">{tc("back")}</span>
      </button>

      <div className="flex-1 flex flex-col items-center z-10 p-6 pt-20 pb-16 overflow-y-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 text-center">
          {t("title")}
        </h1>
        <div className="mb-6 text-center max-w-lg px-2">
          <p className="text-gray-500 text-sm">{t("lastUpdated")}</p>
          {locale !== "en" && (
            <p className="text-amber-800 text-xs mt-2">{tc("legalFullEnglish")}</p>
          )}
        </div>

        <div className="w-full max-w-lg space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-card">
            <p className="text-gray-600 text-sm leading-relaxed">
              Tradcast (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy. This Privacy Policy explains how we collect, use, and protect information when you use the Tradcast game and related services (collectively, the &quot;Service&quot;). By using the Service, you accept the terms of this Policy and our Terms of Service.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mt-3">
              Because Tradcast does not require account registration or login, and access is granted solely through your blockchain wallet, the personal information we collect is minimal by design.
            </p>
          </div>

          <Section title="1. INFORMATION WE COLLECT">
            <SubSection title="1.1 Blockchain & Wallet Data">
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                When you connect your wallet and interact with Tradcast smart contracts on the Celo network, the following information is inherently public on-chain and is accessible to us:
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your wallet address, transaction hashes for game start and end transactions, and on-chain TPOINT token minting records. This data is publicly visible on the Celo blockchain and is not considered private by the nature of blockchain technology.
              </p>
            </SubSection>
            <SubSection title="1.2 Game Session Data">
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                Tradcast collects data about your in-game activity, specifically: the decisions you make during each game session and the timing of those decisions. This data is collected for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm leading-relaxed space-y-1 mb-3">
                <li><strong>Security and integrity:</strong> To detect and investigate cheating, exploits, or anomalies in gameplay. This data may be reviewed if a security or fairness incident is suspected.</li>
                <li><strong>Leaderboard and tournaments:</strong> To accurately calculate scores, rankings, and prize eligibility.</li>
                <li><strong>Service improvement:</strong> To improve game mechanics, performance, and reliability.</li>
              </ul>
            </SubSection>
            <SubSection title="1.3 Usage & Technical Data">
              <p className="text-gray-600 text-sm leading-relaxed">
                We may automatically collect technical information about how you interact with the Service, such as pages visited, features used, and general usage patterns. This information is collected in aggregate and is used to improve the Service.
              </p>
            </SubSection>
            <SubSection title="1.4 Support Communications">
              <p className="text-gray-600 text-sm leading-relaxed">
                If you contact us for support through our website or social media, we collect the information you provide in order to respond to your inquiry. We do not retain personally identifiable information beyond what is necessary to address your request.
              </p>
            </SubSection>
          </Section>

          <Section title="2. INFORMATION WE WILL NEVER COLLECT">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Tradcast will never ask for and does not collect your wallet private keys, seed phrases, or passwords. We do not require you to create an account, and we do not collect your name, email address, or any other traditional personal identifiers as part of normal Service use.
            </p>
            <p className="text-amber-700 text-sm font-semibold">
              Never trust anyone or any website claiming to be Tradcast that asks for your private key or seed phrase.
            </p>
          </Section>

          <Section title="3. HOW WE USE YOUR INFORMATION">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">We use the information we collect for the following purposes:</p>
            <ul className="list-disc list-inside text-gray-600 text-sm leading-relaxed space-y-1">
              <li>To operate and provide the Service, including processing game sessions and minting TPOINT tokens to your wallet.</li>
              <li>To maintain the leaderboard and administer tournaments and giveaways.</li>
              <li>To detect and investigate security issues, exploits, or unfair gameplay.</li>
              <li>To analyze and improve the performance and features of the Service.</li>
              <li>To respond to support inquiries.</li>
              <li>To comply with applicable legal obligations.</li>
            </ul>
          </Section>

          <Section title="4. SHARING & DISCLOSURE">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Tradcast does not sell, rent, or trade your information to third parties. We may share information only in the following limited circumstances:
            </p>
            <SubSection title="4.1 Legal Requirements">
              <p className="text-gray-600 text-sm leading-relaxed">
                We may disclose information to law enforcement, governmental agencies, or other legal authorities if required by law, court order, or to protect our legal rights and comply with applicable regulations.
              </p>
            </SubSection>
            <SubSection title="4.2 Public Blockchain Data">
              <p className="text-gray-600 text-sm leading-relaxed">
                Data recorded on the Celo blockchain — including wallet addresses and transaction history — is inherently public and visible to anyone. Tradcast has no ability to make this data private.
              </p>
            </SubSection>
            <SubSection title="4.3 Service Providers">
              <p className="text-gray-600 text-sm leading-relaxed">
                We may engage trusted third-party service providers (such as analytics tools) to help operate the Service. These providers are contractually obligated to handle data securely and only for the purposes we specify.
              </p>
            </SubSection>
          </Section>

          <Section title="5. COOKIES & TRACKING TECHNOLOGIES">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Our website may use cookies — small text files stored on your device — to track how you use the site, remember preferences, and analyze site usage. You can control or disable cookies through your browser settings. Note that disabling cookies may affect certain features of the website.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              We may use analytics tools such as Google Analytics to help us understand usage patterns and improve the Service. These tools may collect anonymized data about site visits and interactions.
            </p>
          </Section>

          <Section title="6. DATA RETENTION">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              We retain game session and usage data for as long as necessary to fulfill the purposes described in this Policy, including security monitoring, leaderboard integrity, and legal compliance. When data is no longer needed for these purposes, we delete or anonymize it.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Blockchain transaction data is permanently recorded on the Celo network and cannot be deleted by Tradcast or anyone else — this is an inherent property of public blockchains.
            </p>
          </Section>

          <Section title="7. SECURITY">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              We implement industry-standard security measures to protect information collected through the Service. However, no internet-based system is perfectly secure, and we cannot guarantee the absolute security of data transmitted over the internet.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              You are responsible for maintaining the security of your own wallet, including safeguarding your private keys and seed phrases. Tradcast is not liable for any loss resulting from unauthorized access to your wallet.
            </p>
          </Section>

          <Section title="8. THIRD-PARTY SERVICES">
            <p className="text-gray-600 text-sm leading-relaxed">
              Tradcast integrates with third-party platforms including Farcaster, MetaMask, Phantom, and MiniPay. Your use of these platforms is governed by their own privacy policies, which we encourage you to review. Tradcast is not responsible for the privacy practices of third-party services.
            </p>
          </Section>

          <Section title="9. CHILDREN'S PRIVACY">
            <p className="text-gray-600 text-sm leading-relaxed">
              Tradcast is not directed at children under the age of 13 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect information from children. If you believe a child has provided information to us, please contact us and we will promptly remove it.
            </p>
          </Section>

          <Section title="10. CHANGES TO THIS POLICY">
            <p className="text-gray-600 text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. When we do, we will update the &quot;Last Updated&quot; date at the top of this document. We encourage you to review this Policy periodically. Your continued use of the Service after any changes constitutes your acceptance of the updated Policy.
            </p>
          </Section>

          <Section title="11. COMPLIANCE">
            <p className="text-gray-600 text-sm leading-relaxed">
              This Privacy Policy is designed to comply with applicable privacy laws. If you believe this Policy does not meet the legal requirements of your jurisdiction, you may choose not to use the Service.
            </p>
          </Section>

          <Section title="12. CONTACT">
            <p className="text-gray-600 text-sm leading-relaxed">
              If you have questions, concerns, or requests regarding this Privacy Policy, please reach out to the Tradcast team through our official Farcaster channel or website.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-card">
      <h2 className="text-base font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">{title}</h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      {children}
    </div>
  );
}
