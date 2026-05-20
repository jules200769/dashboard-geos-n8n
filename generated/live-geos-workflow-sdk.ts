const openAI_Chat_Model1 = languageModel({ type: '@n8n/n8n-nodes-langchain.lmChatOpenAi', version: 1.3, config: { name: 'OpenAI Chat Model1', parameters: { model: { __rl: true, value: 'gpt-4.1-mini', mode: 'list', cachedResultName: 'gpt-4.1-mini' }, builtInTools: {}, options: { temperature: 0.4 } }, position: [-5408, 4384] } });
const openAI_Chat_Model10 = languageModel({ type: '@n8n/n8n-nodes-langchain.lmChatOpenAi', version: 1.3, config: { name: 'OpenAI Chat Model10', parameters: { model: { __rl: true, value: 'gpt-4.1-mini', mode: 'list', cachedResultName: 'gpt-4.1-mini' }, builtInTools: {}, options: { temperature: 0.4 } }, position: [-4720, 4336] } });

const dashboard_Save_Webhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2,
  config: { name: 'Dashboard Save Webhook', parameters: { httpMethod: 'POST', path: 'geos-save-demo', options: {} }, position: [-1872, 4304] }
});

const prepare_Saved_Lead_Payload = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Prepare Saved Lead Payload', parameters: { jsCode: 'const input = $input.first().json;\n\n// Normalize incoming save payload from dashboard so downstream CRM nodes can use stable fields.\nreturn [{\n  json: {\n    ...input,\n    save_source: \'dashboard\',\n    save_received_at: new Date().toISOString(),\n  }\n}];' }, position: [-1680, 4304] }
});

const saved_Lead_Received = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Saved Lead Received', position: [-1456, 4304] }
});

const monitor_Gmail_Inbox1 = trigger({
  type: 'n8n-nodes-base.gmailTrigger',
  version: 1.2,
  config: { name: 'Monitor Gmail Inbox1', parameters: { pollTimes: { item: [{ mode: 'everyMinute' }] }, filters: { labelIds: ['INBOX', 'IMPORTANT'] } }, position: [-6256, 4176] }
});

const if1 = node({
  type: 'n8n-nodes-base.if',
  version: 2.3,
  config: { name: 'If1', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 3 }, conditions: [{ id: 'cf2b1542-e577-4cb6-944d-7959b54fe106', leftValue: expr('{{ $json.From }}'), rightValue: 'noreply@', operator: { type: 'string', operation: 'contains' } }, { id: 'f5909a44-2d21-4129-8ce5-638fe7cde84d', leftValue: expr('{{ $json.From }}'), rightValue: 'sales-france@', operator: { type: 'string', operation: 'contains' } }, { id: '6ee6c0f2-2704-4155-b616-5112811fa8ef', leftValue: expr('{{ $json.From }}'), rightValue: 'Margot Machault', operator: { type: 'string', operation: 'contains' } }, { id: 'bd60ad06-472c-4db6-8f5c-96566f82c099', leftValue: expr('{{ $json.From }}'), rightValue: 'Geos', operator: { type: 'string', operation: 'contains' } }, { id: 'bf696cdf-9db4-422f-840f-879000f2d0b9', leftValue: expr('{{ $json.From }}'), rightValue: 'GEOS', operator: { type: 'string', operation: 'contains' } }, { id: '18c9d30c-ae05-45d4-a315-0cf6bcf3edb4', leftValue: expr('{{ $json.From }}'), rightValue: '@geos-laboratories.com', operator: { type: 'string', operation: 'contains' } }, { id: '9f88abcb-35df-4989-a30e-8d13a9b883f5', leftValue: expr('{{ $json.From }}'), rightValue: 'sales@geos-laboratories.com', operator: { type: 'string', operation: 'equals', name: 'filter.operator.equals' } }, { id: '6d60c681-7100-4a00-8ca8-af736bf67b68', leftValue: expr('{{ $json.From }}'), rightValue: 'info@geos-laboratories.com', operator: { type: 'string', operation: 'contains' } }], combinator: 'or' }, options: {} }, position: [-6016, 4160] }
});

const get_Full_Email1 = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.1,
  config: { name: 'Get Full Email1', parameters: { operation: 'get', messageId: expr('{{ $json.id }}'), simple: false, options: {} }, position: [-5760, 4160] }
});

const analyze_Email_Sentiment1 = node({
  type: '@n8n/n8n-nodes-langchain.sentimentAnalysis',
  version: 1.1,
  config: { name: 'Analyze Email Sentiment1', parameters: { inputText: expr('{{ \'From: \' + ($json.from || \'\') + \'\\n\\n\' + ($json.text || $json.snippet) }}'), options: { categories: 'Positive, Neutral, Negative', systemPromptTemplate: 'You are a highly accurate sentiment analyzer specialized in the events and conferences industry. Analyze the sentiment of incoming emails related to event sponsorship, exhibition, attendance, speaking opportunities, vendor partnerships, and general event inquiries.\n\nCategorize each email into EXACTLY ONE of these categories: {categories}\n\n**Positive**: The sender shows clear interest, enthusiasm, or intent to sponsor, exhibit, attend, speak, or partner. They are asking about pricing, availability, packages, or next steps. Includes referrals, warm introductions, and repeat clients.\n\n**Neutral**: The sender is gathering information, asking general questions, requesting brochures or agendas, or has not yet indicated clear buying intent. Includes early-stage inquiries and informational requests.\n\n**Negative**: The sender is declining, canceling, expressing dissatisfaction, complaining about pricing, withdrawing interest, or making unfavorable comparisons to competitor events. Includes cancellation requests and negative feedback, and any type of newsletters/advertisement, invitation trade fair/show.\n\nIMPORTANT: Evaluate sentiment relative to OUR event/company. If the sender is negative about a competitor but positive toward us, classify as Positive. Focus on buying intent and business relationship signals.\n\nAUTOMATIC RULE: If the From address starts with \'noreply@\' or \'no-reply@, Sales-email domain or any other domain that looks like they are doing business on a daily base.\', ALWAYS classify as Negative â€\u201D regardless of email content. These are automated messages with no human buying intent.\n\nYOU MUST CHOOSE EXACTLY ONE CATEGORY!\nUse the provided formatting instructions.', includeDetailedResults: true, enableAutoFixing: true } }, position: [-5408, 4160], subnodes: { model: openAI_Chat_Model1 } }
});

const route_by_Sentiment1 = node({
  type: 'n8n-nodes-base.switch',
  version: 3.2,
  config: { name: 'Route by Sentiment1', parameters: { rules: { values: [{ conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, combinator: 'and', conditions: [{ id: 'e02cba87-1ce9-4b70-9be5-0650f861f7b3', operator: { type: 'string', operation: 'equals' }, leftValue: expr('{{ $json.sentimentAnalysis.category }}'), rightValue: 'Positive' }] }, renameOutput: true, outputKey: 'Positive' }, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, combinator: 'and', conditions: [{ id: '103002ae-e819-4a83-91b0-bb90f662a4ec', operator: { type: 'string', operation: 'equals' }, leftValue: expr('{{ $json.sentimentAnalysis.category }}'), rightValue: 'Neutral' }] }, renameOutput: true, outputKey: 'Neutral' }, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, combinator: 'and', conditions: [{ id: '6106e888-ec7a-4a06-b218-e1db0bf13d9e', operator: { type: 'string', operation: 'equals' }, leftValue: expr('{{ $json.sentimentAnalysis.category }}'), rightValue: 'Negative' }] }, renameOutput: true, outputKey: 'Negative' }] }, options: { allMatchingOutputs: false } }, position: [-5008, 4160] }
});

const extract_Email_Intelligence1 = node({
  type: '@n8n/n8n-nodes-langchain.informationExtractor',
  version: 1,
  config: { name: 'Extract Email Intelligence1', parameters: { text: expr('{{ $(\'Get Full Email1\').first().json.text || $(\'Get Full Email1\').first().json.snippet || $json.text }}'), attributes: { attributes: [{ name: 'primary_topic', description: 'The main topic of this email. Must be exactly one of: sponsorship, exhibition, attendance, speaking, logistics, pricing, registration, partnership, complaint, general', required: true }, { name: 'secondary_topics', description: 'Other topics mentioned in the email, as a comma-separated string. Use same topic values as primary_topic.' }, { name: 'intent', description: 'The sender\'s intent. Must be exactly one of: booking_inquiry, information_request, complaint, cancellation, referral, follow_up, general', required: true }, { name: 'urgency_score', type: 'number', description: 'Urgency level from 1 (low, just browsing) to 10 (critical, ready to buy/cancel immediately). Consider budget mentions, deadlines, and action language.', required: true }, { name: 'org_name', description: expr('First, look ig the compant name is reconisable in the sender mail-adress, IF NOT: The sender\'s organization/company name.  Extract from signature, email domain, or body. Empty string if unknown. ATTENTION: the org_name could be a compressed version of the trade name. Place a space in org_name; do this ONLY if it is separable with official words. (EXAMPLE: \'\'Novadacement\'\' becomes \'\'Novada cement\'\'. (PROHIBITED: \'\'Nova dacement\'\' because no official word has been specified). Do this only if you think org_name} is compressed. (when you think org_name is not compressed, use that.).) (YOU CAN NOT NAME ORG_NAME ANYTHING LIKE GEOS OR GEOS LABORATORYS BECAUSE THE INTERNAL COMPANY IS NAMED \'\'Geos\'\' AND THIS PROJECT IS ABOUT EXTERNAL LEADS\'\')') }, { name: 'contact_name', description: expr('The sender\'s full name. Extract from signature or greeting. make sure to NEVER extract contact name from {{ $json["headers"]["cc"] }} because \'\'cc\'\' is never the contact. (Also contact CAN NOT be \'\'Maykel Roelen\'\' because maykel roelen is the recipient and can not recieve an email from him self, so dont even think about that.) {{ $json.cc.value[0].name }} is probably the name, but NEVER empy value\n') }, { name: 'budget_mentioned', type: 'boolean', description: expr('Whether a specific budget, price, or monetary amount is mentioned. true or false.'), required: true }, { name: 'event_referenced', description: 'The name of the specific event or conference mentioned. Empty string if none.' }, { name: 'suggested_action', description: 'A brief one-sentence recommended next action for the sales team. Be specific and actionable.', required: true }, { name: 'phone_number', description: 'The sender\'s phone number if present anywhere in the email body or signature. Include the country code if visible (e.g. +31 6 12345678). Return the number exactly as written. Empty string if no phone number is found.' }, { name: 'contact_title', description: 'The sender\'s job title, taken ONLY from an explicit signature line or sign-off (e.g. \'Sales Director\', \'Procurement Manager\', \'Head of Operations\', \'CEO\'). Look only at the signature block at the end of the email or just below the sender\'s name. Do NOT infer the title from the body text, do NOT guess based on company or context. Return an empty string if no explicit title is present in the signature.' }, { name: 'industry', description: 'The industry of the sender\'s company. Must be exactly one of: admixtures, aggregates (incl. armourstone), concrete, natural stone (incl. rocks), soil, diverse, masonry, prefabricated concrete, cement, fly ash, gypsum, slags, bitumen, fillers, asphalt, competitor. Choose the best match based on email content, company name, signature, or domain. Use \'diverse\' if the industry is unclear or does not fit any other category. Use \'competitor\' if the sender appears to be a competing company.', required: true }] }, options: {} }, position: [-4720, 4144], subnodes: { model: openAI_Chat_Model10 } }
});

const prepare_Analytics_Row1 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Prepare Analytics Row1', parameters: { jsCode: '// Prepare analytics row from enriched email data\n// $input comes from Extract Email Intelligence\nconst item = $input.first().json;\n\n// Sentiment data â€\u201D try direct property first, then upstream node reference\nlet sentimentCategory = \'Unknown\';\nlet sentimentConfidence = \'N/A\';\ntry {\n  if (item.sentimentAnalysis) {\n    sentimentCategory = item.sentimentAnalysis.category || \'Unknown\';\n    sentimentConfidence = String(item.sentimentAnalysis.confidence || \'N/A\');\n  } else {\n    const sentimentNode = $(\'Analyze Email Sentiment1\').first().json;\n    sentimentCategory = sentimentNode.sentimentAnalysis?.category || \'Unknown\';\n    sentimentConfidence = String(sentimentNode.sentimentAnalysis?.confidence || \'N/A\');\n  }\n} catch (e) {\n  // Fallback â€\u201D sentiment data not available\n}\n\n// Gmail data â€\u201D handle from field as string OR object\nlet fromField = \'\';\nlet subject = \'\';\ntry {\n  // Try to get from the input item first\n  let rawFrom = item.from || null;\n  let rawSubject = item.subject || \'\';\n\n  // If not on input, try the Get Full Email node\n  if (!rawFrom) {\n    const gmail = $(\'Get Full Email1\').first().json;\n    rawFrom = gmail.from || \'\';\n    rawSubject = gmail.subject || \'\';\n  }\n\n  // Handle from field: could be string "Name <email>" or object {name, email}\n  if (typeof rawFrom === \'object\' && rawFrom !== null) {\n    // Object format: {name: "John Doe", email: "user@example.com"}\n    if (rawFrom.email) {\n      fromField = rawFrom.name ? `${rawFrom.name} <${rawFrom.email}>` : rawFrom.email;\n    } else if (rawFrom.value && Array.isArray(rawFrom.value)) {\n      // Some email parsers return {value: [{address: "...", name: "..."}]}\n      const first = rawFrom.value[0];\n      fromField = first ? (first.name ? `${first.name} <${first.address}>` : first.address || \'\') : \'\';\n    } else {\n      fromField = JSON.stringify(rawFrom);\n    }\n  } else {\n    fromField = String(rawFrom || \'\');\n  }\n\n  subject = String(rawSubject || \'\');\n} catch (e) {\n  // Fallback â€\u201D gmail data not available\n}\n\n// Extract domain from email â€\u201D fromField is guaranteed to be a string now\nconst domainMatch = fromField.match(/@([^>\\s]+)/);\n\nreturn [{\n  json: {\n    timestamp: new Date().toISOString(),\n    sentiment: sentimentCategory,\n    confidence: sentimentConfidence,\n    sender_email: fromField,\n    sender_domain: domainMatch ? domainMatch[1] : \'\',\n    subject: subject,\n    primary_topic: String(item.primary_topic || item.output?.primary_topic || \'\'),\n    secondary_topics: String(item.secondary_topics || item.output?.secondary_topics || \'\'),\n    intent: String(item.intent || item.output?.intent || \'\'),\n    urgency_score: Number(item.urgency_score || item.output?.urgency_score || 0),\n    org_name: String(item.org_name || item.output?.org_name || \'\'),\n    contact_name: String(item.contact_name || item.output?.contact_name || \'\'),\n    budget_mentioned: String(item.budget_mentioned ?? item.output?.budget_mentioned ?? false),\n    event_referenced: String(item.event_referenced || item.output?.event_referenced || \'\'),\n    suggested_action: String(item.suggested_action || item.output?.suggested_action || \'\'),\n    phone_number: String(item.phone_number || item.output?.phone_number || \'\'),\n    contact_title: String(item.contact_title || item.output?.contact_title || \'\'),\n    industry: String(item.industry || item.output?.industry || \'diverse\'),\n    week_number: getWeekNumber(new Date())\n  }\n}];\n\nfunction getWeekNumber(d) {\n  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));\n  const dayNum = date.getUTCDay() || 7;\n  date.setUTCDate(date.getUTCDate() + 4 - dayNum);\n  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));\n  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);\n}' }, position: [-4416, 4144] }
});

const prepare_CRM_Data1 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Prepare CRM Data1', parameters: { jsCode: '// Prepare CRM data for Salesforce upsert\nconst item = $input.first().json;\n\n// Capture full email body for dashboard display\nlet emailBody = \'\';\ntry {\n  const fullEmail = $(\'Get Full Email1\').first().json;\n  emailBody = fullEmail.text || fullEmail.snippet || \'\';\n} catch (e) {\n  // Email body not available\n}\n\n// Extract clean email from "Name <email>" format or object\nlet cleanEmail = item.sender_email || \'\';\nif (typeof cleanEmail === \'object\') {\n  cleanEmail = cleanEmail.email || cleanEmail.address || JSON.stringify(cleanEmail);\n}\ncleanEmail = String(cleanEmail);\nconst emailMatch = cleanEmail.match(/<([^>]+)>/);\nif (emailMatch) cleanEmail = emailMatch[1];\nelse if (cleanEmail.includes(\'@\')) cleanEmail = cleanEmail.trim();\n\n// Split contact name into first + last\nconst fullName = String(item.contact_name || \'\').trim();\nconst nameParts = fullName.split(/\\s+/).filter(Boolean);\nconst firstName = nameParts[0] || \'\';\nconst lastName = nameParts.length > 1 ? nameParts.slice(1).join(\' \') : (nameParts[0] || \'Unknown\');\n\n// Extract phone number â€\u201D AI-extracted value with regex fallback from email body\nlet phoneNumber = String(item.phone_number || \'\').trim();\nif (!phoneNumber && emailBody) {\n  const phoneMatch = emailBody.match(/(?:\\+?[\\d][\\d\\s\\-().]{6,}[\\d])/);\n  if (phoneMatch) phoneNumber = phoneMatch[0].trim();\n}\n\n// Map sentiment to Salesforce Lead Rating\nconst ratingMap = { Positive: \'Hot\', Neutral: \'Warm\', Negative: \'Cold\' };\n\n// Determine if Opportunity should be created (hot leads only)\nconst urgency = Number(item.urgency_score) || 0;\nconst budgetMentioned = item.budget_mentioned === \'true\';\nconst createOpportunity = (item.sentiment === \'Positive\' && urgency >= 7) || budgetMentioned;\n\nreturn [{\n  json: {\n    // Standard Lead fields\n    email: cleanEmail,\n    firstName: firstName,\n    lastName: lastName,\n    company: String(item.org_name || item.sender_domain || \'Unknown\'),\n    leadRating: ratingMap[item.sentiment] || \'Warm\',\n    description: String(item.suggested_action || \'\'),\n    // Custom fields for Salesforce\n    sentiment: String(item.sentiment || \'Unknown\'),\n    sentimentConfidence: String(item.confidence || \'N/A\'),\n    primaryTopic: String(item.primary_topic || \'\'),\n    leadIntent: String(item.intent || \'\'),\n    urgencyScore: urgency,\n    budgetMentioned: budgetMentioned,\n    eventReferenced: String(item.event_referenced || \'\'),\n    emailDomain: String(item.sender_domain || \'\'),\n    lastEmailSubject: String(item.subject || \'\'),\n    suggestedAction: String(item.suggested_action || \'\'),\n    // Opportunity control flags\n    createOpportunity: createOpportunity,\n    opportunityName: createOpportunity\n      ? (item.primary_topic || \'Inquiry\') + \' â€\u201D \' + (item.org_name || cleanEmail) + \' (Week \' + (item.week_number || \'\') + \')\'\n      : \'\',\n    emailBody: emailBody,\n    phone_number: phoneNumber,\n    title: String(item.contact_title || \'\'),\n    contact_title: String(item.contact_title || \'\'),\n    industry: String(item.industry || \'diverse\')\n  }\n}];' }, position: [-4224, 4144] }
});

const is_Internal_Email_1 = node({
  type: 'n8n-nodes-base.if',
  version: 2.2,
  config: { name: 'Is Internal Email?1', parameters: { conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: 'intern-check-1', leftValue: expr('{{ $json.company }}'), rightValue: 'GEOS LABORATORIES', operator: { type: 'string', operation: 'equals' } }, { id: 'intern-check-2', leftValue: expr('{{ $json.company }}'), rightValue: 'Geos France', operator: { type: 'string', operation: 'equals' } }, { id: 'intern-check-3', leftValue: expr('{{ $json.email }}'), rightValue: 'geos-laboratories.com', operator: { type: 'string', operation: 'equals' } }, { id: 'a7e5b3f1-fefb-4ebe-94ce-903f9727b559', leftValue: expr('{{ $json.company }}'), rightValue: 'Geos', operator: { type: 'string', operation: 'contains' } }, { id: '05cf5421-f790-4551-b8cc-850c082730f0', leftValue: expr('{{ $json.company }}'), rightValue: 'GEOS FRANCE', operator: { type: 'string', operation: 'equals', name: 'filter.operator.equals' } }, { id: 'dea0094b-4a92-4127-8509-f40521e6c6d8', leftValue: expr('{{ $json.company }}'), rightValue: 'GEOS', operator: { type: 'string', operation: 'contains' } }, { id: 'ea1fd368-6521-41fa-a54d-0c6cc5be7dd4', leftValue: expr('{{ $json.company }}'), rightValue: 'GEOS Laboratories', operator: { type: 'string', operation: 'equals', name: 'filter.operator.equals' } }, { id: '8f29c8b8-587c-46e3-9e1a-88331d6386d5', leftValue: expr('{{ $json.email }}'), rightValue: 'customerservice@geos-laboratories.com', operator: { type: 'string', operation: 'equals' } }], combinator: 'or' }, options: { ignoreCase: true } }, position: [-4048, 4144] }
});

const build_SF_Search_Variants1 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Build SF Search Variants1', parameters: { jsCode: 'try {\n  const item = $input.first().json ?? {};\n  const rawCompany = String(item.company ?? item.org_name ?? \'\').trim();\n\n  const add = (set, value) => {\n    const clean = String(value ?? \'\').replace(/\\s+/g, \' \').trim();\n    if (clean) set.add(clean);\n  };\n\n  const variants = new Set();\n  const normalizedSpaces = rawCompany\n    .replace(/[._/\\\\]+/g, \' \')\n    .replace(/[-\\u2013\\u2014]+/g, \' \')\n    .replace(/\\s+/g, \' \')\n    .trim();\n\n  add(variants, rawCompany);\n  add(variants, normalizedSpaces);\n\n  // Try without common legal suffixes (BVBA/BV/NV/...) so we can match SF accounts like\n  // "Resourcefull Houthalen" even if the inbound company includes "BVBA".\n  if (normalizedSpaces) {\n    const stripped = normalizedSpaces\n      .replace(/\\b(?:bvba|bv|nv|sa|srl|sprl|gmbh|ag|ltd|limited|inc|llc|plc|kg|oy|ab)\\b\\.?/gi, \' \')\n      .replace(/\\s+/g, \' \')\n      .trim();\n    add(variants, stripped);\n  }\n\n  if (normalizedSpaces) {\n    const words = normalizedSpaces.split(\' \').filter(Boolean);\n    add(variants, words.join(\' \'));\n    add(variants, words.join(\'-\'));\n    add(variants, words.join(\'\'));\n    add(variants, words.join(\'.\'));\n  }\n\n  const asciiCompact = rawCompany\n    .normalize(\'NFD\')\n    .replace(/[\\u0300-\\u036f]/g, \'\')\n    .replace(/[^A-Za-z0-9]/g, \'\');\n  add(variants, asciiCompact);\n\n  const companyVariants = [...variants].filter(Boolean).slice(0, 12);\n\n  try {\n    const data = $getWorkflowStaticData(\'global\');\n    data.sfAccountSearchResults = [];\n  } catch (e) {\n    // Static data can be unavailable in some task-runner contexts; normalization has a fallback.\n  }\n\n  return [{\n    json: {\n      ...item,\n      companyVariants,\n    },\n  }];\n} catch (error) {\n  return [{ json: { companyVariants: [], sfVariantBuildError: String(error.message ?? error) } }];\n}' }, position: [-3824, 4160] }
});

const sF_Get_Lead_By_Email = node({
  type: 'n8n-nodes-base.salesforce',
  version: 1,
  config: { name: 'SF Get Lead By Email', parameters: { resource: 'contact', operation: 'getAll', options: { conditionsUi: { conditionValues: [{ field: 'Email', value: expr('{{ $json.email }}') }] } } }, position: [-3536, 3984] }
});

const merge_SF_Search_Results1 = merge({
  version: 3.2,
  config: { name: 'Merge SF Search Results1', parameters: { numberInputs: 3 }, position: [-3168, 4112] }
});

const sF_Get_Contact_By_Name1 = node({
  type: 'n8n-nodes-base.salesforce',
  version: 1,
  config: { name: 'SF Get Contact By Name1', parameters: { resource: 'search', query: expr('{{ (() => {\n  const esc = (s) => String(s ?? \'\').trim().replace(/\'/g, "\'\'");\n  const fn = esc($json.firstName);\n  const ln = esc($json.lastName);\n  if (!fn || !ln) {\n    return "SELECT Id, Email, FirstName, LastName, AccountId FROM Contact LIMIT 0";\n  }\n  return "SELECT Id, Email, FirstName, LastName, AccountId FROM Contact WHERE FirstName = \'" + fn + "\' AND LastName = \'" + ln + "\' LIMIT 50";\n})() }}') }, position: [-3536, 4160], alwaysOutputData: true, onError: 'continueRegularOutput' }
});

const split_SF_Company_Variants1 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Split SF Company Variants1', parameters: { jsCode: 'const item = $input.first().json ?? {};\nconst variants = Array.isArray(item.companyVariants) ? item.companyVariants : [];\nconst outputVariants = variants.length ? variants : [\'\'];\n\nreturn outputVariants.map((companyVariant, index) => ({\n  json: {\n    ...item,\n    companyVariant,\n    companyVariantIndex: index,\n  },\n}));' }, position: [-3888, 4368] }
});

const loop_SF_Account_Variants1 = node({
  type: 'n8n-nodes-base.splitInBatches',
  version: 3,
  config: { name: 'Loop SF Account Variants1', parameters: { options: { reset: false } }, position: [-3616, 4448] }
});

const filter_SF_Loop_To_Merge = node({
  type: 'n8n-nodes-base.filter',
  version: 2.3,
  config: { name: 'Filter SF Loop To Merge', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 3 }, conditions: [{ id: 'c1111111-1111-4111-8111-111111111111', leftValue: expr('{{ Object.keys($json).length }}'), rightValue: 0, operator: { type: 'number', operation: 'gt' } }, { id: 'c2222222-2222-4222-8222-222222222222', leftValue: expr('{{ $(\'Loop SF Account Variants1\').context.noItemsLeft === true }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleOperator: true } }], combinator: 'or' }, options: {} }, position: [-3360, 4272] }
});

const sF_Get_Account_By_Name_Variant1 = node({
  type: 'n8n-nodes-base.salesforce',
  version: 1,
  config: { name: 'SF Get Account By Name Variant1', parameters: { resource: 'search', query: expr('{{ (() => {\n  let v = String($json.companyVariant ?? \'\').trim().replace(/[%_]/g, \' \').replace(/\\s+/g, \' \').trim();\n  let d = String($json.emailDomain ?? $json.sender_domain ?? \'\').trim().toLowerCase();\n\n  if (v) v = v.replace(/\'/g, "\'\'");\n  if (d) d = d.replace(/\'/g, "\'\'");\n\n  const clauses = [];\n  if (v) clauses.push("Name LIKE \'%" + v + "%\' ");\n  if (d) clauses.push("Website LIKE \'%" + d + "%\' ");\n\n  if (!clauses.length) return \'SELECT Id, Name, Website FROM Account LIMIT 0\';\n\n  return (\n    \'SELECT Id, Name, Website FROM Account WHERE \' +\n    clauses.join(\' OR \') +\n    \' LIMIT 25\'\n  );\n})() }}') }, position: [-3280, 4432] }
});

const capture_Account_Hits = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Capture Account Hits', parameters: { jsCode: 'const staticData = $getWorkflowStaticData(\'global\');\nif (!Array.isArray(staticData.sfAccountSearchResults)) {\n  staticData.sfAccountSearchResults = [];\n}\nconst seen = new Set(staticData.sfAccountSearchResults.map((a) => String(a.Id ?? \'\').trim()).filter(Boolean));\n\nfor (const item of $input.all()) {\n  const j = item.json ?? {};\n  const id = String(j.Id ?? \'\').trim();\n  const name = String(j.Name ?? \'\').trim();\n  if (id && name && !seen.has(id)) {\n    seen.add(id);\n    staticData.sfAccountSearchResults.push({\n      Id: id,\n      Name: name,\n      Website: String(j.Website ?? \'\').trim(),\n    });\n  }\n}\n\nreturn $input.all();' }, position: [-3072, 4416] }
});

const send_a_message1 = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: { name: 'Send a message1', parameters: { sendTo: 'julez.roelen@gmail.com', subject: 'skipper', emailType: 'text', message: 'mail van papa die geskipped is, niet relevant begin check', options: {} }, position: [-5008, 4512] }
});

const when_clicking_Execute_workflow = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'When clicking \u2018Execute workflow\u2019', position: [-6448, 3856] }
});

const get_a_message = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: { name: 'Get a message', parameters: { operation: 'get', messageId: '19dfbed343389b83' }, position: [-6160, 3840] }
});

const parse_input1 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'parse input1', parameters: { jsCode: 'try {\n  const base = $(\'Prepare CRM Data1\').first().json ?? {};\n  const norm = (s) => String(s ?? \'\').trim().toLowerCase();\n  const baseEmail = norm(base.email);\n  const firstName = String(base.firstName ?? \'\').trim();\n  const lastName = String(base.lastName ?? \'\').trim();\n  const company = String(base.company ?? \'\').trim();\n\n  const isLeadHit = (j) => {\n    const id = String(j.Id ?? \'\').trim();\n    const em = norm(j.Email);\n    return Boolean(id && em && baseEmail && em === baseEmail);\n  };\n\n  const isContactHit = (j) => {\n    const id = String(j.Id ?? \'\').trim();\n    const fn = String(j.FirstName ?? \'\').trim();\n    const ln = String(j.LastName ?? \'\').trim();\n    return Boolean(id && (fn || ln));\n  };\n\n  let leadResults = [];\n  let contactResults = [];\n  try {\n    leadResults = $(\'SF Get Lead By Email\').all().map((i) => i.json).filter(isLeadHit);\n  } catch (e) {\n    leadResults = [];\n  }\n  try {\n    contactResults = $(\'SF Get Contact By Name1\').all().map((i) => i.json).filter(isContactHit);\n  } catch (e) {\n    contactResults = [];\n  }\n\n  let accounts = [];\n  try {\n    const sd = $getWorkflowStaticData(\'global\');\n    const raw = Array.isArray(sd.sfAccountSearchResults) ? sd.sfAccountSearchResults : [];\n    const seen = new Set();\n    for (const a of raw) {\n      const id = String(a.Id ?? \'\').trim();\n      if (!id || seen.has(id)) continue;\n      seen.add(id);\n      accounts.push({\n        Id: id,\n        Name: String(a.Name ?? \'\').trim(),\n        Website: String(a.Website ?? \'\').trim(),\n      });\n    }\n  } catch (e) {\n    accounts = [];\n  }\n\n  const existsInSalesforce = leadResults.length > 0 || contactResults.length > 0;\n  const matchedIn = [];\n  if (contactResults.length) matchedIn.push(\'Contact\');\n  if (leadResults.length) matchedIn.push(\'Lead\');\n  if (accounts.length) matchedIn.push(\'Account\');\n\n  const accountFound = accounts.length > 0;\n  const best = accounts[0] || { Id: \'\', Name: \'\', Website: \'\' };\n  const matchedAccountId = best.Id || \'\';\n  const matchedAccountName = best.Name || \'\';\n  const matchedAccountWebsite = best.Website != null ? String(best.Website) : \'\';\n\n  const matchedAccounts = accounts.map((a) => ({\n    id: a.Id,\n    name: a.Name,\n    website: a.Website != null ? String(a.Website) : \'\',\n  }));\n\n  const fullName = [firstName, lastName].filter(Boolean).join(\' \').trim() || \'onbekende persoon\';\n\n  let reason = \'\';\n  if (existsInSalesforce && accountFound && matchedAccountName) {\n    reason = `Persoon gevonden (${matchedIn.filter((x) => x !== \'Account\').join(\' en \') || \'Contact/Lead\'}) voor ${fullName}; Account \'${matchedAccountName}\' (${matchedAccountId}) gevonden.`;\n  } else if (existsInSalesforce) {\n    reason = `Contact of Lead gevonden voor ${fullName} (${matchedIn.filter((x) => x !== \'Account\').join(\', \')}).`;\n  } else if (accountFound && matchedAccountName) {\n    reason = `Account \'${matchedAccountName}\' gevonden via bedrijfsnaam-varianten, maar geen Contact of Lead gevonden voor ${fullName}. Persoon is nieuw.`;\n  } else {\n    reason = `Geen Account, Contact of Lead gevonden voor ${fullName}${company ? ` (${company})` : \'\'}.`;\n  }\n\n  return [\n    {\n      json: {\n        ...base,\n        existsInSalesforce,\n        matchedIn,\n        reason,\n        accountFound,\n        matchedAccountId,\n        matchedAccountName,\n        matchedAccountWebsite,\n        matchedAccounts,\n        prefillAccount: {\n          id: matchedAccountId,\n          name: matchedAccountName,\n          website: matchedAccountWebsite,\n        },\n      },\n    },\n  ];\n} catch (error) {\n  let base = {};\n  try {\n    base = $(\'Prepare CRM Data1\').first().json ?? {};\n  } catch (e) {\n    base = {};\n  }\n  return [\n    {\n      json: {\n        ...base,\n        existsInSalesforce: false,\n        matchedIn: [],\n        reason: `Fout bij Salesforce-duplicaatcheck: ${String(error.message ?? error)}`,\n        accountFound: false,\n        matchedAccountId: \'\',\n        matchedAccountName: \'\',\n        matchedAccountWebsite: \'\',\n        matchedAccounts: [],\n        prefillAccount: { id: \'\', name: \'\', website: \'\' },\n      },\n    },\n  ];\n}' }, position: [-2896, 4112] }
});

const exists_in_Salesforce_1 = node({
  type: 'n8n-nodes-base.if',
  version: 2.2,
  config: { name: 'Exists in Salesforce?1', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: 'sf-exists-check', leftValue: expr('{{ $json.existsInSalesforce }}'), rightValue: true, operator: { type: 'boolean', operation: 'equals' } }], combinator: 'and' }, options: {} }, position: [-2704, 4128] }
});

const send_Not_Found_Lead_Email9 = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: { name: 'Send Not Found Lead Email9', parameters: { sendTo: 'julez.roelen@gmail.com', subject: 'WEL gevonden in Salesforce', emailType: 'text', message: expr('{{ "Deze persoon WEL niet gevonden in Salesforce, gegevens:\\n\\n" + JSON.stringify($json, null, 2) }}'), options: {} }, position: [-2288, 3856] }
});

const prepare_Dashboard_Not_Found_Payload = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Prepare Dashboard Not-Found Payload', parameters: { jsCode: 'const item = $input.first().json ?? {};\n\nconst firstName = String(item.firstName ?? \'\').trim();\nconst lastName = String(item.lastName ?? \'\').trim();\nconst contactName = [firstName, lastName].filter(Boolean).join(\' \').trim();\n\nconst email = String(item.email ?? \'\').trim();\nconst senderEmail = contactName && email ? `${contactName} <${email}>` : email;\n\nconst subject = String(item.lastEmailSubject ?? item.subject ?? \'\').trim();\nconst urgencyScoreRaw = item.urgencyScore ?? item.urgency_score ?? 0;\nconst urgencyScore = Number(urgencyScoreRaw);\n\nconst budgetMentionedRaw = item.budgetMentioned ?? item.budget_mentioned ?? false;\nconst budgetMentioned =\n  typeof budgetMentionedRaw === \'string\'\n    ? budgetMentionedRaw.toLowerCase() === \'true\'\n    : Boolean(budgetMentionedRaw);\n\nconst matchedIn = Array.isArray(item.matchedIn) ? item.matchedIn : [];\nconst prefillAccount = item.prefillAccount && typeof item.prefillAccount === \'object\' ? item.prefillAccount : {};\nconst matchedAccountId = String(item.matchedAccountId ?? item.matched_account_id ?? prefillAccount.id ?? \'\').trim();\nconst matchedAccountName = String(item.matchedAccountName ?? item.matched_account_name ?? prefillAccount.name ?? \'\').trim();\nconst matchedAccountWebsite = String(item.matchedAccountWebsite ?? item.matched_account_website ?? prefillAccount.website ?? \'\').trim();\nconst accountFound = Boolean(item.accountFound) || Boolean(matchedAccountId) || matchedIn.includes(\'Account\');\nconst accountName = String(item.account_name ?? matchedAccountName ?? prefillAccount.name ?? item.company ?? item.org_name ?? \'\').trim();\n\n// The dashboard uses message_id or id to set source_message_id for dedup/upsert.\nconst messageId = String(item.message_id ?? item.id ?? (email ? `${email}|${subject}` : `unknown|${subject}`));\n\nreturn [\n  {\n    json: {\n      message_id: messageId,\n      contact_name: contactName,\n      org_name: String(item.company ?? item.org_name ?? \'\').trim(),\n      sender_email: senderEmail,\n      sender_domain: String(item.emailDomain ?? item.sender_domain ?? \'\').trim(),\n      subject: subject,\n      sentiment: String(item.sentiment ?? \'Unknown\'),\n      confidence: String(item.sentimentConfidence ?? item.confidence ?? \'N/A\'),\n      primary_topic: String(item.primaryTopic ?? item.primary_topic ?? \'\').trim(),\n      secondary_topics: String(item.secondaryTopics ?? item.secondary_topics ?? \'\').trim(),\n      intent: String(item.leadIntent ?? item.intent ?? \'\').trim(),\n      urgency_score: Number.isFinite(urgencyScore) ? Math.max(0, Math.min(10, urgencyScore)) : 0,\n      budget_mentioned: budgetMentioned,\n      event_referenced: String(item.eventReferenced ?? item.event_referenced ?? \'\').trim(),\n      suggested_action: String(item.suggestedAction ?? item.suggested_action ?? \'\').trim(),\n      existsInSalesforce: Boolean(item.existsInSalesforce),\n      matchedIn,\n      reason: String(item.reason ?? \'\').trim(),\n      accountFound,\n      salesforce_mode: accountFound ? \'create_contact_under_existing_account\' : \'create_account_then_contact\',\n      matchedAccountId,\n      matchedAccountName,\n      matchedAccountWebsite,\n      matchedAccounts: Array.isArray(item.matchedAccounts) ? item.matchedAccounts : [],\n      account_name: accountName,\n      prefillAccount: {\n        ...prefillAccount,\n        id: matchedAccountId || prefillAccount.id || \'\',\n        name: accountName || matchedAccountName || prefillAccount.name || \'\',\n        website: matchedAccountWebsite || prefillAccount.website || \'\',\n      },\n      emailBody: String(item.emailBody ?? \'\'),\n      phone_number: (() => {\n        const raw = String(item.phone_number ?? \'\').trim();\n        // Strip leading country code (+XX or 00XX) to get the local number\n        return raw.replace(/^(?:\\+\\d{1,3}|00\\d{1,3})[\\s\\-.]?/, \'\').replace(/[\\s\\-.]/g, \'\');\n      })(),\n      phone_country_code: (() => {\n        const raw = String(item.phone_number ?? \'\').trim();\n        const match = raw.match(/^(\\+\\d{1,3}|00\\d{1,3})/);\n        if (match) return match[1].replace(/^00/, \'+\');\n        return \'\';\n      })(),\n      industry: String(item.industry ?? \'diverse\').trim(),\n      contact_title: String(item.contact_title ?? item.title ?? \'\').trim(),\n    },\n  },\n];' }, position: [-2320, 4416], onError: 'continueRegularOutput' }
});

const send_To_Dashboard_Queue = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: { name: 'Send To Dashboard Queue', parameters: { method: 'POST', url: 'https://dashboard-geos-n8n.vercel.app/api/webhooks/lead-not-found', sendHeaders: true, headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }, { name: 'x-webhook-secret', value: 'geos_2026_super_secret_change_me' }] }, sendBody: true, specifyBody: 'json', jsonBody: expr('{{ $json }}'), options: {} }, position: [-2096, 4480] }
});

const send_Not_Found_Lead_Email1 = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: { name: 'Send Not Found Lead Email1', parameters: { sendTo: 'julez.roelen@gmail.com', subject: 'Niet gevonden in Salesforce', emailType: 'text', message: expr('{{ "Deze persoon is niet gevonden in Salesforce, gegevens:\\n\\n" + JSON.stringify($json, null, 2) }}'), options: {} }, position: [-2144, 4272] }
});

const send_a_text_message = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: { name: 'Send a text message', parameters: { chatId: '7672911602', text: '{{ "Deze persoon is niet gevonden in Salesforce, gegevens:\\n\\n" + JSON.stringify($json, null, 2) }}', additionalFields: {} }, position: [-2112, 4064] }
});

const wf = workflow('7KfEGkujnKsE9AUZ', 'Live Geos', { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: true, timeSavedMode: 'fixed', callerPolicy: 'workflowsFromSameOwner', timeSavedPerExecution: 5 });

export default wf
  .add(dashboard_Save_Webhook)
  .to(prepare_Saved_Lead_Payload)
  .to(saved_Lead_Received)
  .add(monitor_Gmail_Inbox1)
  .to(if1.onFalse(get_Full_Email1
    .to(analyze_Email_Sentiment1)))
  .add(analyze_Email_Sentiment1.output(0).to(route_by_Sentiment1.onCase(0, extract_Email_Intelligence1
    .to(prepare_Analytics_Row1)
    .to(prepare_CRM_Data1)
    .to(is_Internal_Email_1.onFalse(build_SF_Search_Variants1
      .to([
        sF_Get_Lead_By_Email,
        sF_Get_Contact_By_Name1,
        split_SF_Company_Variants1
        .to(splitInBatches(loop_SF_Account_Variants1)
        .onEachBatch(sF_Get_Account_By_Name_Variant1
          .to(capture_Account_Hits)
          .to(nextBatch(loop_SF_Account_Variants1)))
        .onDone(filter_SF_Loop_To_Merge))])))).onCase(1, extract_Email_Intelligence1).onCase(2, extract_Email_Intelligence1)))
  .add(analyze_Email_Sentiment1.output(1).to(route_by_Sentiment1))
  .add(analyze_Email_Sentiment1.output(2).to(send_a_message1))
  .add(when_clicking_Execute_workflow)
  .to(get_a_message)
  .to(if1)
  .add(sF_Get_Lead_By_Email.to(merge_SF_Search_Results1.input(0)))
  .add(sF_Get_Contact_By_Name1.to(merge_SF_Search_Results1.input(1)))
  .add(filter_SF_Loop_To_Merge.to(merge_SF_Search_Results1.input(2)))
  .add(merge_SF_Search_Results1)
  .to(parse_input1
  .to(exists_in_Salesforce_1.onTrue(send_Not_Found_Lead_Email9).onFalse([prepare_Dashboard_Not_Found_Payload
    .to(send_To_Dashboard_Queue), send_Not_Found_Lead_Email1, send_a_text_message])))