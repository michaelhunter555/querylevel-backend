import mongoose from "mongoose";

interface QueryGPTProps extends mongoose.Document {
  userId: string;
  date: Date;
  response: string;
}

const QueryGPTSchema = new mongoose.Schema<QueryGPTProps>({
  userId: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now() },
  response: { type: String, required: true },
});

export default mongoose.models.QueryGPT ||
  mongoose.model<QueryGPTProps>("QueryGPT", QueryGPTSchema);
