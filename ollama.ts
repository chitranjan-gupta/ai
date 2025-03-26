import ollama from "ollama";

function getWeatherInformation(args: { city: string }) {
  const weatherOptions = ["sunny", "cloudy", "rainy", "snowy", "windy"];
  return `The weather in ${args.city} is ${weatherOptions[Math.floor(Math.random() * weatherOptions.length)]}`;
}

const getWeatherInformationTool = {
    type: 'function',
    function: {
        name: 'getWeatherInformation',
        description: 'show the weather in a given city to the user',
        parameters: {
            type: 'object',
            required: ['city'],
            properties: {
                city: { type: 'string', description: 'city of the user' },
            }
        }
    }
}

async function run(model: string) {
    // Initialize conversation with a user query
    let messages = [{ role: 'user', content: 'What is the weather in London?' }];

    // First API call: Send the query and function description to the model
    const response = await ollama.chat({
        model: model,
        messages: messages,
        tools: [
            getWeatherInformationTool
        ],
    })
    // Add the model's response to the conversation history
    messages.push(response.message);

    // Check if the model decided to use the provided function
    if (!response.message.tool_calls || response.message.tool_calls.length === 0) {
        console.log("The model didn't use the function. Its response was:");
        console.log(response.message.content);
        return;
    }

    // Process function calls made by the model
    if (response.message.tool_calls) {
        const availableFunctions = {
            getWeatherInformation: getWeatherInformation,
        };
        for (const tool of response.message.tool_calls) {
            const functionToCall = availableFunctions[tool.function.name];
            const functionResponse = functionToCall(tool.function.arguments);
            console.log('functionResponse', functionResponse)
            // Add function response to the conversation
            messages.push({
                role: 'tool',
                content: functionResponse,
            });
        }
    }

    // Second API call: Get final response from the model
    const finalResponse = await ollama.chat({
        model: model,
        messages: messages,
    });
    console.log(finalResponse.message.content);
}

run('llama3.2').catch(error => console.error("An error occurred:", error));