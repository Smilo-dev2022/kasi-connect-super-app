# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container to match the hardcoded path in the app
WORKDIR /workspace/moderation_service

# Copy the requirements file into the container
COPY moderation_service/requirements.txt ./

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application's code from the host to the container
COPY moderation_service/ ./

# Make port 8002 available to the world outside this container
EXPOSE 8002

# Run app.main:app when the container launches
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
