import { NextRequest, NextResponse } from 'next/server';

interface AgentFacts {
  id: string;
  agent_name: string;
  capabilities: {
    modalities: string[];
    skills: string[];
  };
  endpoints: {
    static: string[];
    adaptive_resolver: {
      url: string;
      policies: string[];
    };
  };
  certification: {
    level: string;
    issuer: string;
    attestations: string[];
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Agent validation endpoint called');
    const body = await request.json();
    const { agentFacts } = body;

    console.log('Received agent facts:', agentFacts);

    if (!agentFacts) {
      console.log('No agent facts provided');
      return NextResponse.json({
        isValid: false,
        errors: { general: 'Agent facts are required' },
        warnings: {}
      }, { status: 400 });
    }

    // Validate agent facts
    const validationResult = validateAgentFacts(agentFacts);

    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Agent validation error:', error);
    return NextResponse.json({
      isValid: false,
      errors: { general: 'Failed to validate agent facts' },
      warnings: {}
    }, { status: 500 });
  }
}

function validateAgentFacts(facts: AgentFacts): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Validate ID (should be UUID format)
  if (!facts.id || !facts.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    errors.id = 'ID must be a valid UUID v4 format';
  }

  // Validate agent name
  if (!facts.agent_name || facts.agent_name.trim().length < 3) {
    errors.agent_name = 'Agent name must be at least 3 characters long';
  }

  // Validate capabilities
  if (!facts.capabilities) {
    errors.capabilities = 'Capabilities are required';
  } else {
    // Validate modalities
    if (!facts.capabilities.modalities || facts.capabilities.modalities.length === 0) {
      errors.modalities = 'At least one modality is required';
    }

    // Validate skills
    if (!facts.capabilities.skills || facts.capabilities.skills.length === 0) {
      errors.skills = 'At least one skill is required';
    }
  }

  // Validate endpoints
  if (!facts.endpoints) {
    errors.endpoints = 'Endpoints configuration is required';
  } else {
    // Validate static endpoints
    if (!facts.endpoints.static || facts.endpoints.static.length === 0) {
      errors.static_endpoints = 'At least one static endpoint is required';
    } else {
      // Validate URL format for static endpoints
      const invalidUrls = facts.endpoints.static.filter(url => {
        try {
          new URL(url);
          return false;
        } catch {
          return true;
        }
      });
      if (invalidUrls.length > 0) {
        errors.static_endpoints = `Invalid URLs: ${invalidUrls.join(', ')}`;
      }
    }

    // Validate adaptive resolver
    if (!facts.endpoints.adaptive_resolver) {
      errors.adaptive_resolver = 'Adaptive resolver endpoint is required';
    } else {
      // Validate adaptive resolver URL
      if (!facts.endpoints.adaptive_resolver.url) {
        errors.adaptive_resolver_url = 'Adaptive resolver URL is required';
      } else {
        try {
          new URL(facts.endpoints.adaptive_resolver.url);
        } catch {
          errors.adaptive_resolver_url = 'Invalid URL format';
        }
      }

      // Validate policies
      if (!facts.endpoints.adaptive_resolver.policies || facts.endpoints.adaptive_resolver.policies.length === 0) {
        warnings.adaptive_resolver_policies = 'Consider specifying adaptive resolver policies';
      }
    }
  }

  // Validate certification
  if (!facts.certification) {
    errors.certification = 'Certification information is required';
  } else {
    // Validate certification level
    const validLevels = ['basic', 'verified', 'premium', 'enterprise'];
    if (!validLevels.includes(facts.certification.level)) {
      errors.certification_level = `Level must be one of: ${validLevels.join(', ')}`;
    }

    // Validate issuer
    if (!facts.certification.issuer || facts.certification.issuer.trim().length < 2) {
      errors.certification_issuer = 'Issuer must be at least 2 characters long';
    }

    // Validate attestations
    if (!facts.certification.attestations || facts.certification.attestations.length === 0) {
      warnings.certification_attestations = 'Consider adding certification attestations';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}
