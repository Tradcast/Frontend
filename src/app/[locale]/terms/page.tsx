"use client";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

export default function TermsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("terms");
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
              Please read these Terms of Service (&quot;Terms&quot;) carefully before using Tradcast. By connecting your wallet and using the Service, you agree to be bound by these Terms.
            </p>
          </div>

          <Section title="1. ABOUT TRADCAST">
            <p className="text-gray-600 text-sm leading-relaxed">
              Tradcast is a blockchain-based mini game built on the Celo network, accessible through Farcaster, web browsers, and MiniPay. Players connect their crypto wallets to participate in gameplay sessions and earn TPOINT tokens on the Celo blockchain. Tradcast does not require account registration or login — access is granted through wallet connection only.
            </p>
          </Section>

          <Section title="2. ACCEPTANCE OF TERMS">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              By accessing or using Tradcast — including by connecting a wallet, initiating a game session, or interacting with Tradcast smart contracts — you accept and agree to these Terms in full. If you do not agree, you must not use the Service.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tradcast reserves the right to modify these Terms at any time. The most current version will always be available on our site. Continued use of the Service after any changes constitutes your acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="3. ELIGIBILITY">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              By using Tradcast, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside text-gray-600 text-sm leading-relaxed space-y-1 mb-3">
              <li>You are of legal age in your jurisdiction to enter into binding agreements and to own and transact with cryptographic tokens.</li>
              <li>You are legally permitted to use blockchain-based applications and to hold digital assets in your jurisdiction.</li>
            </ul>
            <p className="text-gray-600 text-sm leading-relaxed">
              You are solely responsible for ensuring your use of the Service complies with all applicable local laws and regulations. Tradcast is not liable for your compliance or non-compliance with such laws.
            </p>
          </Section>

          <Section title="4. WALLET CONNECTION & SECURITY">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Tradcast does not operate its own wallet and does not store, custody, or manage private keys or seed phrases. To use the Service, you connect a third-party wallet — such as MetaMask, Phantom, MiniPay, or a Farcaster-integrated wallet.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              You are solely responsible for the security of your connected wallet. Tradcast is not liable for any loss of funds or assets resulting from unauthorized access to your wallet, loss of credentials, or other security failures on the wallet provider&apos;s side.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              You should never share your wallet&apos;s private key, seed phrase, or passwords with anyone — including Tradcast.
            </p>
          </Section>

          <Section title="5. HOW THE GAME WORKS">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Tradcast is a skill-based mini game played on the Celo blockchain. To begin a game session, players make a small on-chain transaction (approximately $0.01 USD) by calling a Tradcast smart contract function. This transaction starts the game session.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              At the end of each game session, another smart contract function is called to finalize the session. Based on your in-game score, an equivalent number of TPOINT tokens are minted and sent directly to your connected wallet on the Celo network.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tradcast periodically hosts tournaments and giveaways where prizes may be distributed to top-ranking players. Prize eligibility and distribution are at Tradcast&apos;s sole discretion.
            </p>
          </Section>

          <Section title="6. TPOINT TOKENS">
            <SubSection title="6.1 Nature of TPOINT">
              <p className="text-gray-600 text-sm leading-relaxed">
                TPOINT is a utility token on the Celo blockchain, minted as a reward for gameplay. TPOINT tokens currently have no monetary value and are not redeemable for fiat currency or other assets at this time.
              </p>
            </SubSection>
            <SubSection title="6.2 Future Functionality">
              <p className="text-gray-600 text-sm leading-relaxed">
                Tradcast intends to introduce future functionality, including the ability to swap TPOINT tokens for stablecoins. This feature is planned but not yet available. No timeline or guarantee is given for this or any future feature.
              </p>
            </SubSection>
            <SubSection title="6.3 No Investment">
              <p className="text-gray-600 text-sm leading-relaxed">
                TPOINT tokens are not investment instruments, securities, or financial products. Tradcast makes no representations about the future value of TPOINT tokens. You should not acquire TPOINT tokens with any expectation of financial return.
              </p>
            </SubSection>
          </Section>

          <Section title="7. DATA COLLECTION & USE">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Tradcast collects game session data, including in-game decisions and the timing of those decisions. This data is collected for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-600 text-sm leading-relaxed space-y-1 mb-3">
              <li><strong>Security and integrity:</strong> To detect and investigate anomalies, potential exploits, cheating, or system leaks in gameplay.</li>
              <li><strong>Leaderboard and rankings:</strong> To accurately calculate and display player rankings for tournaments and the public leaderboard.</li>
              <li><strong>Service improvement:</strong> To improve game mechanics, performance, and reliability.</li>
            </ul>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tradcast does not collect personally identifiable information beyond your blockchain wallet address, which is inherently public on-chain. By using the Service, you consent to this data collection.
            </p>
          </Section>

          <Section title="8. BLOCKCHAIN & SMART CONTRACT RISKS">
            <SubSection title="8.1 Inherent Blockchain Risks">
              <p className="text-gray-600 text-sm leading-relaxed">
                Blockchain transactions are irreversible. Once a transaction is submitted to the Celo network, it cannot be undone. You assume all risk associated with initiating transactions, including the risk of errors, lost funds, or failed transactions.
              </p>
            </SubSection>
            <SubSection title="8.2 Smart Contract Risk">
              <p className="text-gray-600 text-sm leading-relaxed">
                Tradcast&apos;s gameplay operates via smart contracts. While Tradcast endeavors to maintain secure and accurate smart contracts, all code may contain bugs or vulnerabilities. You acknowledge and accept the inherent risks of interacting with smart contracts, and that Tradcast is not liable for losses arising from smart contract flaws.
              </p>
            </SubSection>
            <SubSection title="8.3 Network & Gas Fees">
              <p className="text-gray-600 text-sm leading-relaxed">
                Using Tradcast requires paying Celo network transaction fees (&quot;gas&quot;). These fees are variable and beyond Tradcast&apos;s control. Tradcast is not responsible for any costs incurred due to failed or pending transactions.
              </p>
            </SubSection>
            <SubSection title="8.4 Cryptography Risks">
              <p className="text-gray-600 text-sm leading-relaxed">
                You understand that advances in technology, including quantum computing, may in the future present risks to cryptographic systems. Tradcast will endeavor to update its protocols to address such risks, but cannot guarantee the security of any system against all future threats.
              </p>
            </SubSection>
          </Section>

          <Section title="9. DISCLAIMERS">
            <p className="text-gray-600 text-sm leading-relaxed">
              The Service is provided on an &quot;AS IS&quot; and &quot;as available&quot; basis, without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. Tradcast makes no warranty that the Service will be uninterrupted, error-free, or free from viruses or other harmful components. Tradcast does not warrant the accuracy or completeness of any content or data provided through the Service.
            </p>
          </Section>

          <Section title="10. LIMITATION OF LIABILITY">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, TRADCAST AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF TOKENS, PROFITS, DATA, OR GOODWILL — ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF TRADCAST HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Tradcast&apos;s total aggregate liability to you for any claims arising from the Service shall not exceed the total transaction fees you have paid to initiate game sessions in the thirty (30) days preceding the claim.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Some jurisdictions do not allow the exclusion or limitation of certain liabilities. In such jurisdictions, Tradcast&apos;s liability is limited to the maximum extent permitted by law.
            </p>
          </Section>

          <Section title="11. INDEMNIFICATION">
            <p className="text-gray-600 text-sm leading-relaxed">
              You agree to indemnify, defend, and hold harmless Tradcast and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any applicable law or regulation; or (d) any transactions you initiate through your connected wallet.
            </p>
          </Section>

          <Section title="12. INTELLECTUAL PROPERTY">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              All content, design, code, branding, and materials comprising Tradcast — including the game logic, smart contracts authored by Tradcast, and associated creative assets — are the property of Tradcast or its licensors and are protected by applicable intellectual property laws.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              You may not copy, modify, distribute, reproduce, or create derivative works from any Tradcast content or materials without prior written permission.
            </p>
          </Section>

          <Section title="13. THIRD-PARTY SERVICES">
            <p className="text-gray-600 text-sm leading-relaxed">
              Tradcast integrates with third-party platforms and wallet providers including Farcaster, MetaMask, Phantom, and MiniPay. Your use of these third-party services is governed by their respective terms and policies. Tradcast has no control over and accepts no liability for third-party services, platforms, or wallet providers.
            </p>
          </Section>

          <Section title="14. CHANGES TO THE SERVICE">
            <p className="text-gray-600 text-sm leading-relaxed">
              Tradcast reserves the right to modify, suspend, or discontinue the Service or any feature thereof at any time, with or without notice. Tradcast is not liable to you or any third party for any such modification, suspension, or discontinuation.
            </p>
          </Section>

          <Section title="15. GOVERNING LAW & DISPUTES">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration, except where prohibited by law. You waive any right to participate in a class action lawsuit or class-wide arbitration.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Any claim or cause of action arising from the use of the Service must be filed within one (1) year after such claim arose, or it will be permanently barred.
            </p>
          </Section>

          <Section title="16. MISCELLANEOUS">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              These Terms constitute the entire agreement between you and Tradcast regarding the Service and supersede all prior agreements on the subject matter.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tradcast&apos;s failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.
            </p>
          </Section>

          <Section title="17. CONTACT">
            <p className="text-gray-600 text-sm leading-relaxed">
              For questions or concerns regarding these Terms, please reach out to the Tradcast team through our official Farcaster channel or website.
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
