import { env } from "~/env";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log("🚀 Starting image to prompt generation...");

    // Enhanced environment variables validation
    const requiredEnvVars = {
      COZE_API_TOKEN: env.COZE_API_TOKEN,
      COZE_WORKFLOW_ID: env.COZE_WORKFLOW_ID,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => {
        const invalidValues = [
          undefined, 
          null, 
          "", 
          "your-coze-api-token-here",
          `your-${key.toLowerCase().replace('_', '-')}-here`
        ];
        return invalidValues.includes(value);
      })
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error("❌ Missing or invalid environment variables:", missingVars);
      return NextResponse.json({
        error: "Environment configuration error",
        details: `Missing or invalid variables: ${missingVars.join(', ')}`,
        setup_guide: "Please configure these variables in Vercel Dashboard → Settings → Environment Variables",
        documentation: "See ENVIRONMENT_SETUP.md for detailed instructions"
      }, { status: 500 });
    }

    console.log("✅ Environment variables validated successfully");

    const formData = await request.formData();
    const file = formData.get("image") as File;
    const stylePreference = formData.get("style_preference") as string || "detailed";

    if (!file) {
      console.error("❌ No image file provided");
      return NextResponse.json({
        error: "No image file provided",
        details: "Please select an image file to upload"
      }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      console.error("❌ Invalid file type:", file.type);
      return NextResponse.json({
        error: "Invalid file type",
        details: `Supported formats: ${allowedTypes.join(', ')}`,
        received: file.type
      }, { status: 400 });
    }

    if (file.size > maxSize) {
      console.error("❌ File too large:", file.size);
      return NextResponse.json({
        error: "File too large",
        details: `Maximum file size: ${maxSize / 1024 / 1024}MB`,
        received: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      }, { status: 400 });
    }

    console.log("📁 Received file:", {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
    });
    console.log("🎨 Style preference:", stylePreference);

    // Step 1: Upload file to Coze
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    console.log("📤 Uploading image to Coze API...");
    const uploadResponse = await fetch("https://api.coze.cn/v1/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.COZE_API_TOKEN}`,
      },
      body: uploadFormData,
    });

    console.log("📤 Upload response status:", uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("❌ Upload failed:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText,
      });
      
      let errorMessage = "Failed to upload image to AI service";
      let statusCode = 500;
      
      if (uploadResponse.status === 401) {
        errorMessage = "Invalid API token. Please check COZE_API_TOKEN configuration.";
        statusCode = 500;
      } else if (uploadResponse.status === 413) {
        errorMessage = "Image file too large for AI service.";
        statusCode = 400;
      } else if (uploadResponse.status === 429) {
        errorMessage = "AI service rate limit exceeded. Please try again later.";
        statusCode = 429;
      }
      
      return NextResponse.json({
        error: errorMessage,
        details: `Coze API error: ${uploadResponse.status} ${uploadResponse.statusText}`,
        debug: errorText
      }, { status: statusCode });
    }

    const uploadData = await uploadResponse.json();
    console.log("Upload successful, file data:", uploadData);

    const fileId = uploadData.data?.id;
    if (!fileId) {
      console.error("No file ID in upload response");
      return NextResponse.json(
        { error: "No file ID returned from upload" },
        { status: 500 }
      );
    }

    // Use the correct format for file parameter: JSON string with file_id
    const imageParam = JSON.stringify({ file_id: fileId });
    
    console.log("Using image parameter for workflow:", imageParam);

    // Step 2: Call workflow with image and style_preference parameters
    console.log("Calling Coze workflow API...");
    
    // Use the correct format with JSON string containing file_id
    const workflowPayload = {
      workflow_id: env.COZE_WORKFLOW_ID,
      parameters: {
        "image": imageParam,
        "style_preferenc": stylePreference,
        "user_query": ""
      }
    };

    console.log("Workflow payload:", JSON.stringify(workflowPayload, null, 2));

    const workflowResponse = await fetch("https://api.coze.cn/v1/workflow/stream_run", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.COZE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workflowPayload),
    });

    console.log("Workflow response status:", workflowResponse.status);

    if (!workflowResponse.ok) {
      const errorText = await workflowResponse.text();
      console.error("Coze workflow failed:", errorText);
      return NextResponse.json(
        { error: `Workflow execution failed: ${errorText}` },
        { status: workflowResponse.status }
      );
    }

    // Handle Server-Sent Events (SSE) streaming response
    const responseText = await workflowResponse.text();
    console.log("Workflow response text:", responseText);

    // Parse SSE format response
    let generatedPrompt = "Generated prompt not found in response";
    let hasError = false;
    let errorMessage = "";
    
    try {
      // Split by lines and process SSE format
      const lines = responseText.split('\n');
      let currentEvent = "";
      let currentData = "";
      
      for (const line of lines) {
        if (line.startsWith('id:')) {
          // New event starting
          currentEvent = "";
          currentData = "";
        } else if (line.startsWith('event:')) {
          currentEvent = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          currentData = line.substring(5).trim();
          
          try {
            const data = JSON.parse(currentData);
            console.log(`SSE Event: ${currentEvent}, Data:`, JSON.stringify(data, null, 2));
            
            // Check for errors
            if (currentEvent === 'Error' && data.error_message) {
              hasError = true;
              errorMessage = data.error_message;
              console.error("Workflow execution failed:", data.error_message);
              break;
            }
            
            // Check for successful output in various possible locations
            if (data.output) {
              generatedPrompt = data.output;
              console.log("Found output in data.output:", generatedPrompt);
            }
            
            // Check for result field
            if (data.result) {
              generatedPrompt = data.result;
              console.log("Found output in data.result:", generatedPrompt);
            }
            
            // Check for workflow_result
            if (data.workflow_result) {
              generatedPrompt = data.workflow_result;
              console.log("Found output in data.workflow_result:", generatedPrompt);
            }
            
            // Check for content field (which may contain JSON string)
            if (data.content) {
              console.log("Found content field:", data.content);
              try {
                // Try to parse content as JSON
                const contentData = JSON.parse(data.content);
                if (contentData.output) {
                  generatedPrompt = contentData.output;
                  console.log("Found output in parsed content:", generatedPrompt);
                }
              } catch (parseError) {
                // If not JSON, use content directly
                generatedPrompt = data.content;
                console.log("Using content directly:", generatedPrompt);
              }
            }
            
            // Check for node outputs in workflow data
            if (data.node_outputs && Array.isArray(data.node_outputs)) {
              for (const nodeOutput of data.node_outputs) {
                if (nodeOutput.output) {
                  generatedPrompt = nodeOutput.output;
                  console.log("Found output in node_outputs:", generatedPrompt);
                }
                if (nodeOutput.result) {
                  generatedPrompt = nodeOutput.result;
                  console.log("Found result in node_outputs:", generatedPrompt);
                }
              }
            }
            
            // Check for outputs array
            if (data.outputs && Array.isArray(data.outputs)) {
              for (const output of data.outputs) {
                if (output.value || output.content || output.text) {
                  generatedPrompt = output.value || output.content || output.text;
                  console.log("Found output in outputs array:", generatedPrompt);
                }
              }
            }
            
            // Check for any text-like content
            if (typeof data === 'string' && data.trim().length > 0) {
              generatedPrompt = data;
              console.log("Found string data:", generatedPrompt);
            }
            
          } catch (parseError) {
            // Skip invalid JSON data
            continue;
          }
        }
      }
      
      if (hasError) {
        return NextResponse.json(
          { error: `Workflow execution failed: ${errorMessage}` },
          { status: 400 }
        );
      }
      
    } catch (error) {
      console.error("Error parsing SSE response:", error);
      // Fallback: use the raw response text if parsing fails
      generatedPrompt = responseText;
    }

    const duration = Date.now() - startTime;
    console.log("🎉 Image to prompt generation completed successfully!", {
      promptLength: generatedPrompt.length,
      duration: `${duration}ms`,
      fileId: fileId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
      fileId: fileId,
      metadata: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("❌ Critical error in image-to-prompt API:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json({
      error: "Internal server error",
      details: "An unexpected error occurred while processing your request",
      timestamp: new Date().toISOString(),
      support: "Please try again or contact support if the issue persists"
    }, { status: 500 });
  }
}