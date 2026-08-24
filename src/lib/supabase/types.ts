export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          actor_id: string | null
          description: string
          entity_id: string | null
          entity_type: string
          event_type: string
          household_id: string | null
          id: string
          metadata: Json
          occurred_at: string
        }
        Insert: {
          actor_id?: string | null
          description: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          household_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
        }
        Update: {
          actor_id?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          household_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      agreements: {
        Row: {
          agreement_type: Database["public"]["Enums"]["agreement_type"]
          completed_at: string | null
          created_at: string
          dropbox_sign_hosted_url: string | null
          dropbox_sign_request_id: string | null
          executed_document_path: string | null
          household_id: string
          id: string
          sent_at: string | null
          signers: Json
          status: Database["public"]["Enums"]["agreement_status"]
          template_used: string | null
        }
        Insert: {
          agreement_type: Database["public"]["Enums"]["agreement_type"]
          completed_at?: string | null
          created_at?: string
          dropbox_sign_hosted_url?: string | null
          dropbox_sign_request_id?: string | null
          executed_document_path?: string | null
          household_id: string
          id?: string
          sent_at?: string | null
          signers?: Json
          status?: Database["public"]["Enums"]["agreement_status"]
          template_used?: string | null
        }
        Update: {
          agreement_type?: Database["public"]["Enums"]["agreement_type"]
          completed_at?: string | null
          created_at?: string
          dropbox_sign_hosted_url?: string | null
          dropbox_sign_request_id?: string | null
          executed_document_path?: string | null
          household_id?: string
          id?: string
          sent_at?: string | null
          signers?: Json
          status?: Database["public"]["Enums"]["agreement_status"]
          template_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreements_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_profiles: {
        Row: {
          application_id: string
          created_at: string
          current_address: string | null
          id: string
          person_id: string
          status: Database["public"]["Enums"]["applicant_status"]
          submitted_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          current_address?: string | null
          id?: string
          person_id: string
          status?: Database["public"]["Enums"]["applicant_status"]
          submitted_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          current_address?: string | null
          id?: string
          person_id?: string
          status?: Database["public"]["Enums"]["applicant_status"]
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_references: {
        Row: {
          applicant_profile_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          reference_type: string | null
          relationship: string | null
        }
        Insert: {
          applicant_profile_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          reference_type?: string | null
          relationship?: string | null
        }
        Update: {
          applicant_profile_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          reference_type?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_references_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_snapshots: {
        Row: {
          applicant_profile_id: string
          captured_at: string
          captured_reason: string | null
          id: string
          payload: Json
          version: number
        }
        Insert: {
          applicant_profile_id: string
          captured_at?: string
          captured_reason?: string | null
          id?: string
          payload: Json
          version: number
        }
        Update: {
          applicant_profile_id?: string
          captured_at?: string
          captured_reason?: string | null
          id?: string
          payload?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "application_snapshots_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          access_token: string
          created_at: string
          disclosures_acknowledged_at: string | null
          fee_total: number | null
          household_id: string
          id: string
          property_id: string
          sent_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          token_expires_at: string | null
        }
        Insert: {
          access_token?: string
          created_at?: string
          disclosures_acknowledged_at?: string | null
          fee_total?: number | null
          household_id: string
          id?: string
          property_id: string
          sent_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          disclosures_acknowledged_at?: string | null
          fee_total?: number | null
          household_id?: string
          id?: string
          property_id?: string
          sent_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          attachments: Json
          content: string | null
          created_at: string
          direction: Database["public"]["Enums"]["communication_direction"]
          household_id: string
          id: string
          occurred_at: string
          person_id: string | null
          staff_user_id: string | null
          subject: string | null
          type: Database["public"]["Enums"]["communication_type"]
        }
        Insert: {
          attachments?: Json
          content?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["communication_direction"]
          household_id: string
          id?: string
          occurred_at?: string
          person_id?: string | null
          staff_user_id?: string | null
          subject?: string | null
          type: Database["public"]["Enums"]["communication_type"]
        }
        Update: {
          attachments?: Json
          content?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["communication_direction"]
          household_id?: string
          id?: string
          occurred_at?: string
          person_id?: string | null
          staff_user_id?: string | null
          subject?: string | null
          type?: Database["public"]["Enums"]["communication_type"]
        }
        Relationships: [
          {
            foreignKeyName: "communications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_staff_user_id_fkey"
            columns: ["staff_user_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          accepted_at: string
          applicant_profile_id: string
          consent_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          accepted_at?: string
          applicant_profile_id: string
          consent_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          accepted_at?: string
          applicant_profile_id?: string
          consent_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          adverse_action_report_used: boolean
          adverse_notice_sent_at: string | null
          application_id: string
          decided_at: string
          decided_by: string | null
          decision_type: Database["public"]["Enums"]["agreement_type"] | null
          factors: Json
          id: string
          outcome: Database["public"]["Enums"]["decision_outcome"]
          pre_adverse_notice_sent_at: string | null
          reasoning_notes: string
        }
        Insert: {
          adverse_action_report_used?: boolean
          adverse_notice_sent_at?: string | null
          application_id: string
          decided_at?: string
          decided_by?: string | null
          decision_type?: Database["public"]["Enums"]["agreement_type"] | null
          factors?: Json
          id?: string
          outcome: Database["public"]["Enums"]["decision_outcome"]
          pre_adverse_notice_sent_at?: string | null
          reasoning_notes: string
        }
        Update: {
          adverse_action_report_used?: boolean
          adverse_notice_sent_at?: string | null
          application_id?: string
          decided_at?: string
          decided_by?: string | null
          decision_type?: Database["public"]["Enums"]["agreement_type"] | null
          factors?: Json
          id?: string
          outcome?: Database["public"]["Enums"]["decision_outcome"]
          pre_adverse_notice_sent_at?: string | null
          reasoning_notes?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      discrepancies: {
        Row: {
          applicant_explanation: string | null
          application_id: string
          category: Database["public"]["Enums"]["discrepancy_category"]
          description: string
          id: string
          opened_at: string
          opened_by: string | null
          person_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["discrepancy_status"]
        }
        Insert: {
          applicant_explanation?: string | null
          application_id: string
          category: Database["public"]["Enums"]["discrepancy_category"]
          description: string
          id?: string
          opened_at?: string
          opened_by?: string | null
          person_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["discrepancy_status"]
        }
        Update: {
          applicant_explanation?: string | null
          application_id?: string
          category?: Database["public"]["Enums"]["discrepancy_category"]
          description?: string
          id?: string
          opened_at?: string
          opened_by?: string | null
          person_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["discrepancy_status"]
        }
        Relationships: [
          {
            foreignKeyName: "discrepancies_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrepancies_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrepancies_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrepancies_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          household_id: string
          id: string
          is_sensitive: boolean
          related_entity_id: string | null
          related_entity_type: string | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string
          household_id: string
          id?: string
          is_sensitive?: boolean
          related_entity_id?: string | null
          related_entity_type?: string | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          household_id?: string
          id?: string
          is_sensitive?: boolean
          related_entity_id?: string | null
          related_entity_type?: string | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_history: {
        Row: {
          applicant_profile_id: string
          created_at: string
          employer_name: string
          employer_phone: string | null
          end_date: string | null
          id: string
          income_amount: number | null
          income_frequency: string | null
          is_current: boolean
          position: string | null
          start_date: string | null
        }
        Insert: {
          applicant_profile_id: string
          created_at?: string
          employer_name: string
          employer_phone?: string | null
          end_date?: string | null
          id?: string
          income_amount?: number | null
          income_frequency?: string | null
          is_current?: boolean
          position?: string | null
          start_date?: string | null
        }
        Update: {
          applicant_profile_id?: string
          created_at?: string
          employer_name?: string
          employer_phone?: string | null
          end_date?: string | null
          id?: string
          income_amount?: number | null
          income_frequency?: string | null
          is_current?: boolean
          position?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employment_history_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_verifications: {
        Row: {
          bank_income_verification_completed: boolean
          dates_confirmed: boolean | null
          discrepancies_notes: string | null
          employment_history_id: string
          follow_up_required: boolean
          id: string
          income_verified: boolean | null
          method: string | null
          notes: string | null
          source_person: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          bank_income_verification_completed?: boolean
          dates_confirmed?: boolean | null
          discrepancies_notes?: string | null
          employment_history_id: string
          follow_up_required?: boolean
          id?: string
          income_verified?: boolean | null
          method?: string | null
          notes?: string | null
          source_person?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          bank_income_verification_completed?: boolean
          dates_confirmed?: boolean | null
          discrepancies_notes?: string | null
          employment_history_id?: string
          follow_up_required?: boolean
          id?: string
          income_verified?: boolean | null
          method?: string | null
          notes?: string | null
          source_person?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employment_verifications_employment_history_id_fkey"
            columns: ["employment_history_id"]
            isOneToOne: false
            referencedRelation: "employment_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          assigned_staff_id: string | null
          created_at: string
          desired_move_in: string | null
          id: string
          lead_source: string | null
          notes: string | null
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"]
          property_id: string | null
          rental_type_interest: Database["public"]["Enums"]["rental_type"]
          updated_at: string
        }
        Insert: {
          assigned_staff_id?: string | null
          created_at?: string
          desired_move_in?: string | null
          id?: string
          lead_source?: string | null
          notes?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          property_id?: string | null
          rental_type_interest?: Database["public"]["Enums"]["rental_type"]
          updated_at?: string
        }
        Update: {
          assigned_staff_id?: string | null
          created_at?: string
          desired_move_in?: string | null
          id?: string
          lead_source?: string | null
          notes?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          property_id?: string | null
          rental_type_interest?: Database["public"]["Enums"]["rental_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      income_sources: {
        Row: {
          amount: number | null
          applicant_profile_id: string
          created_at: string
          frequency: string | null
          id: string
          notes: string | null
          source_type: string
        }
        Insert: {
          amount?: number | null
          applicant_profile_id: string
          created_at?: string
          frequency?: string | null
          id?: string
          notes?: string | null
          source_type: string
        }
        Update: {
          amount?: number | null
          applicant_profile_id?: string
          created_at?: string
          frequency?: string | null
          id?: string
          notes?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_sources_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_verifications: {
        Row: {
          contact_attempted_at: string | null
          email_used: string | null
          id: string
          independently_verified: boolean | null
          lease_violations_notes: string | null
          notes: string | null
          notice_given_notes: string | null
          person_spoken_to: string | null
          phone_used: string | null
          property_condition_notes: string | null
          relationship_to_property: string | null
          rent_payment_history_notes: string | null
          residence_history_id: string
          tenancy_dates_confirmed: boolean | null
          verified_at: string | null
          verified_by: string | null
          would_rent_again: Database["public"]["Enums"]["tri_state"] | null
        }
        Insert: {
          contact_attempted_at?: string | null
          email_used?: string | null
          id?: string
          independently_verified?: boolean | null
          lease_violations_notes?: string | null
          notes?: string | null
          notice_given_notes?: string | null
          person_spoken_to?: string | null
          phone_used?: string | null
          property_condition_notes?: string | null
          relationship_to_property?: string | null
          rent_payment_history_notes?: string | null
          residence_history_id: string
          tenancy_dates_confirmed?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          would_rent_again?: Database["public"]["Enums"]["tri_state"] | null
        }
        Update: {
          contact_attempted_at?: string | null
          email_used?: string | null
          id?: string
          independently_verified?: boolean | null
          lease_violations_notes?: string | null
          notes?: string | null
          notice_given_notes?: string | null
          person_spoken_to?: string | null
          phone_used?: string | null
          property_condition_notes?: string | null
          relationship_to_property?: string | null
          rent_payment_history_notes?: string | null
          residence_history_id?: string
          tenancy_dates_confirmed?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          would_rent_again?: Database["public"]["Enums"]["tri_state"] | null
        }
        Relationships: [
          {
            foreignKeyName: "landlord_verifications_residence_history_id_fkey"
            columns: ["residence_history_id"]
            isOneToOne: false
            referencedRelation: "residence_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          description: string
          household_id: string | null
          id: string
          property_id: string
          reported_at: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          description: string
          household_id?: string | null
          id?: string
          property_id: string
          reported_at?: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          description?: string
          household_id?: string | null
          id?: string
          property_id?: string
          reported_at?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          document_ref: string | null
          household_id: string
          id: string
          notice_type: string
          sent_at: string
        }
        Insert: {
          document_ref?: string | null
          household_id: string
          id?: string
          notice_type: string
          sent_at?: string
        }
        Update: {
          document_ref?: string | null
          household_id?: string
          id?: string
          notice_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_document_ref_fkey"
            columns: ["document_ref"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          application_id: string | null
          created_at: string
          household_id: string
          id: string
          paid_at: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          refund_amount: number | null
          square_customer_id: string | null
          square_hosted_url: string | null
          square_invoice_id: string | null
          square_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          application_id?: string | null
          created_at?: string
          household_id: string
          id?: string
          paid_at?: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          refund_amount?: number | null
          square_customer_id?: string | null
          square_hosted_url?: string | null
          square_invoice_id?: string | null
          square_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          application_id?: string | null
          created_at?: string
          household_id?: string
          id?: string
          paid_at?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          refund_amount?: number | null
          square_customer_id?: string | null
          square_hosted_url?: string | null
          square_invoice_id?: string | null
          square_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          created_at: string
          dob: string | null
          email: string | null
          first_name: string
          household_id: string
          id: string
          is_adult: boolean
          last_name: string
          phone: string | null
          relationship_role: string | null
        }
        Insert: {
          created_at?: string
          dob?: string | null
          email?: string | null
          first_name: string
          household_id: string
          id?: string
          is_adult?: boolean
          last_name: string
          phone?: string | null
          relationship_role?: string | null
        }
        Update: {
          created_at?: string
          dob?: string | null
          email?: string | null
          first_name?: string
          household_id?: string
          id?: string
          is_adult?: boolean
          last_name?: string
          phone?: string | null
          relationship_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          breed: string | null
          created_at: string
          household_id: string
          id: string
          name: string | null
          species: string | null
          weight_lbs: number | null
        }
        Insert: {
          breed?: string | null
          created_at?: string
          household_id: string
          id?: string
          name?: string | null
          species?: string | null
          weight_lbs?: number | null
        }
        Update: {
          breed?: string | null
          created_at?: string
          household_id?: string
          id?: string
          name?: string | null
          species?: string | null
          weight_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          application_fee_per_adult: number
          created_at: string
          id: string
          is_furnished: boolean
          jurisdiction_notes: Json
          monthly_rent: number
          name: string
          pet_deposit_allowed: boolean
          security_deposit: number
          status: Database["public"]["Enums"]["property_status"]
        }
        Insert: {
          address: string
          application_fee_per_adult?: number
          created_at?: string
          id?: string
          is_furnished?: boolean
          jurisdiction_notes?: Json
          monthly_rent: number
          name: string
          pet_deposit_allowed?: boolean
          security_deposit: number
          status?: Database["public"]["Enums"]["property_status"]
        }
        Update: {
          address?: string
          application_fee_per_adult?: number
          created_at?: string
          id?: string
          is_furnished?: boolean
          jurisdiction_notes?: Json
          monthly_rent?: number
          name?: string
          pet_deposit_allowed?: boolean
          security_deposit?: number
          status?: Database["public"]["Enums"]["property_status"]
        }
        Relationships: []
      }
      property_staff: {
        Row: {
          property_id: string
          staff_user_id: string
        }
        Insert: {
          property_id: string
          staff_user_id: string
        }
        Update: {
          property_id?: string
          staff_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_staff_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_staff_staff_user_id_fkey"
            columns: ["staff_user_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_checks: {
        Row: {
          applicant_reference_id: string
          attempted_at: string | null
          contact_attempted: boolean
          id: string
          notes: string | null
          outcome: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          applicant_reference_id: string
          attempted_at?: string | null
          contact_attempted?: boolean
          id?: string
          notes?: string | null
          outcome?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          applicant_reference_id?: string
          attempted_at?: string | null
          contact_attempted?: boolean
          id?: string
          notes?: string | null
          outcome?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_checks_applicant_reference_id_fkey"
            columns: ["applicant_reference_id"]
            isOneToOne: false
            referencedRelation: "applicant_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_checks_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      residence_history: {
        Row: {
          address: string
          applicant_profile_id: string
          created_at: string
          id: string
          landlord_email: string | null
          landlord_name: string | null
          landlord_phone: string | null
          move_in_date: string | null
          move_out_date: string | null
          reason_for_leaving: string | null
          rent_amount: number | null
          sequence: number
          was_on_lease: boolean | null
        }
        Insert: {
          address: string
          applicant_profile_id: string
          created_at?: string
          id?: string
          landlord_email?: string | null
          landlord_name?: string | null
          landlord_phone?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          reason_for_leaving?: string | null
          rent_amount?: number | null
          sequence?: number
          was_on_lease?: boolean | null
        }
        Update: {
          address?: string
          applicant_profile_id?: string
          created_at?: string
          id?: string
          landlord_email?: string | null
          landlord_name?: string | null
          landlord_phone?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          reason_for_leaving?: string | null
          rent_amount?: number | null
          sequence?: number
          was_on_lease?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "residence_history_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      screenings: {
        Row: {
          applicant_profile_id: string
          completed_at: string | null
          created_at: string
          id: string
          outcome_summary: string | null
          provider: string
          requested_at: string | null
          requested_by: string | null
          screening_type: string
          status: Database["public"]["Enums"]["screening_status"]
        }
        Insert: {
          applicant_profile_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          outcome_summary?: string | null
          provider?: string
          requested_at?: string | null
          requested_by?: string | null
          screening_type: string
          status?: Database["public"]["Enums"]["screening_status"]
        }
        Update: {
          applicant_profile_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          outcome_summary?: string | null
          provider?: string
          requested_at?: string | null
          requested_by?: string | null
          screening_type?: string
          status?: Database["public"]["Enums"]["screening_status"]
        }
        Relationships: [
          {
            foreignKeyName: "screenings_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenings_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["staff_role"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          due_date: string | null
          household_id: string | null
          id: string
          related_entity_id: string | null
          related_entity_type: string | null
          status: Database["public"]["Enums"]["task_status"]
          type: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          household_id?: string | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          type: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          household_id?: string | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
          provider: Database["public"]["Enums"]["webhook_provider"]
          received_at: string
          related_entity_id: string | null
          related_entity_type: string | null
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_status?: string
          provider: Database["public"]["Enums"]["webhook_provider"]
          received_at?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          provider?: Database["public"]["Enums"]["webhook_provider"]
          received_at?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_staff_role: {
        Args: never
        Returns: Database["public"]["Enums"]["staff_role"]
      }
      is_authenticated_staff: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      agreement_status:
        | "draft"
        | "generated"
        | "sent"
        | "partially_signed"
        | "completed"
        | "declined"
      agreement_type: "traditional_lease" | "lease_option"
      applicant_status: "not_started" | "in_progress" | "submitted"
      application_status:
        | "not_sent"
        | "sent"
        | "in_progress"
        | "submitted"
        | "paid"
        | "reopened"
      communication_direction: "incoming" | "outgoing" | "internal"
      communication_type:
        | "phone"
        | "text"
        | "email"
        | "in_person"
        | "internal_note"
        | "system"
      decision_outcome: "approved" | "denied" | "withdrawn"
      discrepancy_category:
        | "address_not_disclosed"
        | "employment_dates_inconsistent"
        | "income_discrepancy"
        | "landlord_identity_unverified"
        | "rental_dates_inconsistent"
        | "material_information_omitted"
        | "other"
      discrepancy_status:
        | "open"
        | "clarification_requested"
        | "explanation_received"
        | "verified"
        | "resolved"
        | "unresolved"
      document_category:
        | "application"
        | "applicant_upload"
        | "verification"
        | "screening"
        | "lease"
        | "lease_option"
        | "addendum"
        | "notice"
        | "payment"
        | "maintenance"
        | "photo"
        | "correspondence"
        | "other"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
      payment_type:
        | "application_fee"
        | "security_deposit"
        | "first_month_rent"
        | "monthly_rent"
        | "option_consideration"
        | "late_fee"
        | "refund"
        | "other"
      pipeline_stage:
        | "new_lead"
        | "contacted"
        | "showing_scheduled"
        | "showed"
        | "interested"
        | "application_sent"
        | "application_started"
        | "application_submitted"
        | "payment_received"
        | "screening"
        | "verification"
        | "under_review"
        | "approved"
        | "denied"
        | "withdrawn"
        | "lease_sent"
        | "lease_signed"
        | "tenant"
      property_status: "available" | "occupied" | "off_market"
      rental_type: "traditional" | "lease_option" | "undecided"
      screening_status:
        | "not_started"
        | "requested"
        | "pending"
        | "completed"
        | "could_not_complete"
      staff_role: "owner" | "staff" | "readonly"
      task_status: "open" | "in_progress" | "done" | "cancelled"
      tri_state: "yes" | "no" | "unknown"
      webhook_provider: "square" | "dropbox_sign"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      agreement_status: [
        "draft",
        "generated",
        "sent",
        "partially_signed",
        "completed",
        "declined",
      ],
      agreement_type: ["traditional_lease", "lease_option"],
      applicant_status: ["not_started", "in_progress", "submitted"],
      application_status: [
        "not_sent",
        "sent",
        "in_progress",
        "submitted",
        "paid",
        "reopened",
      ],
      communication_direction: ["incoming", "outgoing", "internal"],
      communication_type: [
        "phone",
        "text",
        "email",
        "in_person",
        "internal_note",
        "system",
      ],
      decision_outcome: ["approved", "denied", "withdrawn"],
      discrepancy_category: [
        "address_not_disclosed",
        "employment_dates_inconsistent",
        "income_discrepancy",
        "landlord_identity_unverified",
        "rental_dates_inconsistent",
        "material_information_omitted",
        "other",
      ],
      discrepancy_status: [
        "open",
        "clarification_requested",
        "explanation_received",
        "verified",
        "resolved",
        "unresolved",
      ],
      document_category: [
        "application",
        "applicant_upload",
        "verification",
        "screening",
        "lease",
        "lease_option",
        "addendum",
        "notice",
        "payment",
        "maintenance",
        "photo",
        "correspondence",
        "other",
      ],
      payment_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      payment_type: [
        "application_fee",
        "security_deposit",
        "first_month_rent",
        "monthly_rent",
        "option_consideration",
        "late_fee",
        "refund",
        "other",
      ],
      pipeline_stage: [
        "new_lead",
        "contacted",
        "showing_scheduled",
        "showed",
        "interested",
        "application_sent",
        "application_started",
        "application_submitted",
        "payment_received",
        "screening",
        "verification",
        "under_review",
        "approved",
        "denied",
        "withdrawn",
        "lease_sent",
        "lease_signed",
        "tenant",
      ],
      property_status: ["available", "occupied", "off_market"],
      rental_type: ["traditional", "lease_option", "undecided"],
      screening_status: [
        "not_started",
        "requested",
        "pending",
        "completed",
        "could_not_complete",
      ],
      staff_role: ["owner", "staff", "readonly"],
      task_status: ["open", "in_progress", "done", "cancelled"],
      tri_state: ["yes", "no", "unknown"],
      webhook_provider: ["square", "dropbox_sign"],
    },
  },
} as const
