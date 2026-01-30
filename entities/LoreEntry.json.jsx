{
  "name": "LoreEntry",
  "type": "object",
  "properties": {
    "world_id": {
      "type": "string",
      "description": "World this lore belongs to"
    },
    "campaign_id": {
      "type": "string",
      "description": "Campaign context (optional)"
    },
    "title": {
      "type": "string",
      "description": "Lore entry title"
    },
    "content": {
      "type": "string",
      "description": "Lore content with rich text formatting and images"
    },
    "category": {
      "type": "string",
      "enum": [
        "history",
        "culture",
        "location",
        "faction",
        "character",
        "magic",
        "custom"
      ],
      "description": "Lore category"
    },
    "relationships": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "target_id": { "type": "string" },
          "target_name": { "type": "string" },
          "type": {
            "type": "string",
            "enum": ["ally", "hostile", "neutral", "trade", "rival"]
          },
          "created_date": { "type": "string", "format": "date-time" }
        }
      },
      "description": "Relationships to other entities"
    },
    "author": {
      "type": "string",
      "description": "Original author email"
    },
    "version": {
      "type": "number",
      "default": 1,
      "description": "Current version number"
    },
    "versions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "version_number": { "type": "number" },
          "content": { "type": "string" },
          "edited_by": { "type": "string" },
          "edited_at": { "type": "string", "format": "date-time" },
          "change_summary": { "type": "string" }
        }
      },
      "description": "Version history with rollback capability"
    },
    "collaborators": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Users who have edited"
    },
    "last_edited_by": {
      "type": "string",
      "description": "Last editor email"
    },
    "locked_by": {
      "type": "string",
      "description": "User currently editing (null if unlocked)"
    },
    "locked_at": {
      "type": "string",
      "format": "date-time",
      "description": "When entry was locked"
    },
    "is_approved": {
      "type": "boolean",
      "default": false,
      "description": "GM approval status"
    }
  },
  "required": [
    "world_id",
    "title",
    "content",
    "category"
  ]
}