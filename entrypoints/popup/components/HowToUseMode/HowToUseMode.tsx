import { useState } from 'react';
import { SUPPORTED_SITES } from '../../../../lib/constants';

const PROMPT_TEXT = `Convert the provided video script into the following JSON structure.

For each scene, generate: scene_number, image_prompt, video_prompt, narration.

Requirements:

* image_prompt / video_prompt: exact content from the "Image Prompt" / "Video Prompt" sections, as a single plain text string — no markdown, bullet points, bold, headers, or line breaks.
* narration: exact content from the "Narration" section, in its original language.
* Do not rewrite, improve, summarize, embellish, or reinterpret any scene — preserve all details (descriptions, actions, lighting, composition, atmosphere, style, duration).
* Keep prompts in their original language.
* Return only valid JSON, no nested objects, no omitted scenes — one entry per scene found in the script.

Output format:

{
  "scenes": [
    {
      "scene_number": 1,
      "image_prompt": "...",
      "video_prompt": "...",
      "narration": "..."
    }
  ]
}`;

// Onboarding / "how to use" screen — static walkthrough of the script.json
// format and the 5-step workflow, no batch state involved.
export function HowToUseMode() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMPT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="main how-to-use">
      <div className="welcome-section">
        <p className="welcome-text">
          This extension automates image and video generation on both{' '}
          <a href={SUPPORTED_SITES[0].url} target="_blank" rel="noopener noreferrer">
            {SUPPORTED_SITES[0].name}
          </a>{' '}
          como en{' '}
          <a href={SUPPORTED_SITES[1].url} target="_blank" rel="noopener noreferrer">
            {SUPPORTED_SITES[1].name}
          </a>
          .
        </p>
      </div>

      <div className="steps-container">
        <div className="step-item">
          <div className="step-badge">1</div>
          <p className="step-text">First, prepare all the scenes in your script.</p>
        </div>

        <div className="step-item">
          <div className="step-badge">2</div>
          <div className="step-content">
            <p className="step-text">
              Convert your script to the structured <code>script.json</code>. If you don't have one yet,
              copy the prompt below and use an AI tool to generate it:
            </p>
            <div className="prompt-wrapper">
              <div className="prompt-container">
                <pre className="prompt-preview">{PROMPT_TEXT}</pre>
              </div>
              <button
                className={`icon-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy prompt"
              >
                {copied ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="step-item">
          <div className="step-badge">3</div>
          <div className="step-content">
            <p className="step-text">
              Save the file in an empty folder. The file must be named{' '}
              <strong>exactly</strong> <code>script.json</code>. Initial folder structure:
            </p>
            <div className="folder-structure">
              📁 My-AI-Project/
              <br />
              └── 📄 script.json
            </div>
          </div>
        </div>

        <div className="step-item">
          <div className="step-badge">4</div>
          <div className="step-content">
            <p className="step-text">
              <strong>Step 4:</strong> Set up and generate your project's images.
            </p>

            <details className="step-details" style={{ marginTop: '4px' }}>
              <summary>Platform setup (Vibes AI / Google Flow)</summary>
              <div className="details-content">
                <div className="platform-option vibes">
                  <h4>🟣 Vibes AI (Free)</h4>
                  <ul>
                    <li>📝 Note: The platform may be unstable.</li>
                    <li>
                      🚀 No setup is required. Just click Generate in the extension.
                    </li>
                  </ul>
                </div>

                <div className="platform-option flow">
                  <h4>🔵 Google Flow (Free - 0 credits)</h4>
                  <ul>
                    <li>✅ More stable (0 credits).</li>
                    <li>
                      ⚙️ Enable <strong>Agent mode</strong> and select <strong>x2</strong>
                      on the website before generating:
                    </li>
                  </ul>
                  <img
                    src="/flow_image.png"
                    alt="Google Flow image settings"
                    className="guide-img"
                  />
                </div>
              </div>
            </details>

            <div className="sub-step-info" style={{ marginTop: '8px' }}>
              <p className="step-text">
                In the <strong>Project</strong> tab, select your folder, make sure you are in
                <strong>Images</strong> mode, then click <strong>Generate images</strong>:
              </p>
              <img
                src="/ext_image_project.png"
                alt="Generate images in the extension"
                className="screenshot-img"
              />
            </div>

            <div className="sub-step-info" style={{ marginTop: '8px' }}>
              <p className="step-text">
                The extension will automatically create the <code>images</code> subfolder and save the
                images:
              </p>
              <div className="folder-structure" style={{ marginTop: '4px' }}>
                📁 My-AI-Project/
                <br />
                ├── 📁 images/
                <br />
                └── 📄 script.json
              </div>
            </div>
          </div>
        </div>

        <div className="step-item">
          <div className="step-badge">5</div>
          <div className="step-content">
            <p className="step-text">
              <strong>Step 5:</strong> Set up and generate your project's videos.
            </p>

            <details className="step-details" style={{ marginTop: '4px' }}>
              <summary>Platform setup (Vibes AI / Google Flow)</summary>
              <div className="details-content">
                <div className="platform-option vibes">
                  <h4>🟣 Vibes AI (Free)</h4>
                  <ul>
                    <li>📝 Note: The platform may be unstable.</li>
                    <li>
                      🚀 No setup is required. Just click Generate in the extension.
                    </li>
                  </ul>
                </div>

                <div className="platform-option flow">
                  <h4>🔵 Google Flow (10 credits per video)</h4>
                  <ul>
                    <li>💰 Costs 10 credits per video.</li>
                    <li>
                      ⚙️ Switch the agent to <strong>Video</strong> and select{' '}
                      <strong>x1</strong> on the website before generating:
                    </li>
                  </ul>
                  <img src="/flow_video.png" alt="Google Flow video settings" className="guide-img" />
                </div>
              </div>
            </details>

            <div className="sub-step-info" style={{ marginTop: '8px' }}>
              <p className="step-text">
                In the extension, select <strong>Videos</strong> mode and click{' '}
                <strong>Generate videos</strong>:
              </p>
              <img
                src="/ext_video_project.png"
                alt="Generate videos in the extension"
                className="screenshot-img"
              />
            </div>

            <div className="sub-step-info" style={{ marginTop: '8px' }}>
              <p className="step-text">
                The extension will create a <code>videos</code> subfolder, completing the folder structure:
              </p>
              <div className="folder-structure" style={{ marginTop: '4px' }}>
                📁 My-AI-Project/
                <br />
                ├── 📁 images/
                <br />
                ├── 📁 videos/
                <br />
                └── 📄 script.json
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="channel-section">
        <p className="channel-text">
          Find more automation tools and development updates on my channel:{' '}
          <a href="https://www.youtube.com/@Hans-Acha" target="_blank" rel="noopener noreferrer">
            YouTube @Hans-Acha
          </a>
        </p>
      </div>
    </div>
  );
}
