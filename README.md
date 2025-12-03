# The Auto-Creative Engine (Portable Version)

This project implements an "Auto-Creative Engine" leveraging Generative AI to automatically generate variations of ad creatives (images and matching captions) for a given brand. This version is designed for maximum portability and local execution on your personal computer.

## Project Goal

To design and implement a system that takes a brand's logo and product image as input and automatically generates 10+ unique ad creative variations, complete with high-resolution images and compelling, matching captions.

## Hypothetical Scenario (Used for Demonstration)

The demonstration uses the following context:

| Component | Detail |
| :--- | :--- |
| **Brand Name** | EcoBloom |
| **Product Name** | Sustainable Coffee Pods |
| **Key Features/Benefits** | 100% compostable, ethically sourced beans, rich flavor, convenient. |
| **Target Audience** | Environmentally conscious millennials and Gen Z. |
| **Desired Tone** | Fresh, ethical, and modern. |

## Technical Requirements & Architecture

The system is built using Python and leverages two primary AI components:

1.  **Image Generation (Manual Step):** You will use your preferred Image Generation API (e.g., DALL-E 3, Midjourney, Stable Diffusion) to create the base images. The `auto_creative_engine.py` script provides the necessary prompts.
2.  **Text Generation (Automated):** Uses an LLM (via the OpenAI API) to generate a list of ad captions.
3.  **Image Processing (Automated):** Uses the `Pillow` library to automatically overlay the brand's logo onto the base images.

### File Structure

| File | Description |
| :--- | :--- |
| `requirements.txt` | Lists all Python dependencies (`openai`, `Pillow`). |
| `text_generator.py` | Handles the LLM call to generate a list of ad captions. **Update the `BRAND_CONTEXT` here.** |
| `image_generator.py` | Contains the portable `overlay_logo` function. |
| `auto_creative_engine.py` | The main orchestration script. It defines image prompts, loads captions, and runs the logo overlay process. |
| `ecobloom_logo.png` | Placeholder for your brand's logo. |
| `ecobloom_product.png` | Placeholder for your product image (optional, for testing). |
| `base_images/` | **Directory where you must save your manually generated base images.** |
| `creative_variations/` | **Output directory for the final creatives and captions.** |

## Setup and Execution

### 1. Setup Environment

1.  **Clone/Unzip the Project:** Extract the contents of the zip file to a local directory.
2.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Set API Key:** Set your OpenAI API key as an environment variable. The scripts will automatically detect it.
    *   **Linux/macOS:** `export OPENAI_API_KEY="YOUR_API_KEY"`
    *   **Windows (Command Prompt):** `set OPENAI_API_KEY="YOUR_API_KEY"`

### 2. Prepare Assets and Context

1.  **Update Context:** Open `text_generator.py` and modify the `BRAND_CONTEXT` dictionary with your actual brand and product details.
2.  **Place Logo:** Replace the placeholder `ecobloom_logo.png` with your actual brand logo.
3.  **Generate Base Images (Manual Step):**
    *   Run the main script once to see the required image prompts:
        ```bash
        python3 auto_creative_engine.py
        ```
    *   Use the 12 printed prompts to generate images using your preferred AI image generation tool (e.g., DALL-E 3, Midjourney).
    *   **Crucially, save these 12 images** into the newly created `base_images` directory, naming them sequentially: `base_creative_1.png`, `base_creative_2.png`, ..., `base_creative_12.png`.

### 3. Run the Auto-Creative Engine

1.  **Generate Captions:**
    ```bash
    python3 text_generator.py
    ```
    This generates the ad copy and saves it to `generated_captions.json`.
2.  **Run Orchestration (Logo Overlay):**
    ```bash
    python3 auto_creative_engine.py
    ```
    This script will now:
    *   Load the captions from `generated_captions.json`.
    *   Load your logo (`ecobloom_logo.png`).
    *   Iterate through the base images in `base_images/`.
    *   Overlay the logo onto each image.
    *   Save the final creative and its matching caption text file into the `creative_variations` directory.

The final, ready-to-use creatives will be in the `creative_variations` folder.
