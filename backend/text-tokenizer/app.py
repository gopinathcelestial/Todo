from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import spacy
import dateparser
from datetime import datetime

nlp = spacy.load("en_core_web_sm", exclude=["ner"])
nlp.add_pipe("span_marker", config={"model": "tomaarsen/span-marker-roberta-large-ontonotes5"})

app = FastAPI()

origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str

class ExtractedData(BaseModel):
    title: str
    description: str
    due_date: str

def parse_and_format_date(date_str):
    parsed_date = dateparser.parse(date_str)
    
    if not parsed_date:
        return None

    formatted_date = parsed_date.strftime('%Y-%m-%d')
    return formatted_date

@app.post("/extract-entities", response_model=ExtractedData)
async def extract_entities(request: TextRequest):
    doc = nlp(request.text)
    
    # Default values
    title = None
    description = request.text
    due_date = None
    
    entities = [{"entity": entity.text, "label": entity.label_} for entity in doc.ents]
    
    # Find and format the date entity
    for entity in entities:
        if entity['label'] == 'DATE':
            due_date = parse_and_format_date(entity['entity'])
            break
    
    # Generate title by extracting a relevant part of the text
    # For simplicity, let's assume title is a substring before the date entity if found
    if due_date:
        title = request.text.split(entity['entity'])[0].strip()
    else:
        title = description  # Fallback to the whole text as title if no date is found
    
    return ExtractedData(
        title=title,
        description=description,
        due_date=due_date if due_date else "No due date found"
    )

# Run the application with Uvicorn (make sure this file is named main.py)
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
