# Prompts

Every prompt the system uses lives here as Markdown, loaded by `app/llm/prompts.py`.

- **`campaign_agent.md`** — the system prompt for the tool-driven campaign agent. Defines the process (load catalog → interpret brief → discover use cases → rank publishers + exclusions → persona creatives → campaign config → `submit_campaign_plan`). This is the core of the system.
- **`thread_title.md`** — names a chat thread from the advertiser's first message.

The agent is model-driven: rather than a fixed pipeline, the prompt hands the model tools (`list_publishers`, `list_personas`, `submit_campaign_plan`) and lets it orchestrate. The structured contract it must fill is `app/modules/campaigns/schemas.py::CampaignPlan`.
