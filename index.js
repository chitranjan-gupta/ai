import multer from "multer";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { main, plain, getPdfContent, pdfEmbed, withTool } from "./rag.js";

const storage = multer.memoryStorage()

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './uploads')
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//     cb(null, file.fieldname + '-' + uniqueSuffix)
//   }
// })

const upload = multer({ storage: storage })

var corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors(corsOptions));

app.post("/api/chat", async (req, res) => {
  try {
    const rag = false;
    const tool = true;
    const modelName = req.body.modelName;
    const messages = req.body.messages;
    if (messages) {
      const result = tool ? rag ? main(messages): withTool(messages) : plain(messages);
      result.pipeDataStreamToResponse(res);
      // res.setHeader("Content-Type", "text/plain; charset=utf-8");
      // res.status(200);
      // for await (const textPart of result.textStream) {
      //   res.write(textPart);
      // }
      // res.end();
    } else {
      res.status(400).send("Messages is missing");
    }
  } catch (error) {
    console.log(error)
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/upload", upload.array('pdfs', 1), async (req, res) => {
  try {
    const content = await getPdfContent(null, req.files[0].buffer);
    if(content){
      await pdfEmbed(content);
    }
    res.status(201).json({ message: "File Uploaded" });
  } catch (error) {
    console.log(error)
    res.status(500).send("Internal Server Error");
  }
})

app.listen(3000, () => {
  console.log("Server is running on port 3000 ");
});
