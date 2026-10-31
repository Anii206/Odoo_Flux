use chrono::{Datelike, Months, NaiveDate};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct TriggerBillingRequest {
    pub target_date: Option<NaiveDate>,
}

#[derive(Debug, Serialize)]
pub struct BillingRunResult {
    pub target_date: NaiveDate,
    pub subscriptions_scanned: usize,
    pub invoices_generated: usize,
    pub subscriptions_closed: usize,
}

#[allow(dead_code)]
pub fn add_billing_interval(date: NaiveDate, interval: &str) -> NaiveDate {
    match interval {
        "daily" => date + chrono::Duration::days(1),
        "weekly" => date + chrono::Duration::weeks(1),
        "yearly" => date
            .checked_add_months(Months::new(12))
            .unwrap_or(date + chrono::Duration::days(365)),
        _ => date
            .checked_add_months(Months::new(1))
            .unwrap_or(date + chrono::Duration::days(30)),
    }
}

pub fn compute_anchored_billing_date(
    start_date: NaiveDate,
    current_date: NaiveDate,
    interval: &str,
) -> NaiveDate {
    match interval {
        "daily" => current_date + chrono::Duration::days(1),
        "weekly" => current_date + chrono::Duration::weeks(1),
        "yearly" => {
            let years_passed = ((current_date.year() - start_date.year()) as u32).max(0);
            start_date
                .checked_add_months(Months::new((years_passed + 1) * 12))
                .unwrap_or(current_date + chrono::Duration::days(365))
        }
        _ => {
            let diff_years = (current_date.year() - start_date.year()) as i32;
            let diff_months =
                diff_years * 12 + (current_date.month() as i32 - start_date.month() as i32);
            let next_k = (diff_months + 1).max(1) as u32;
            let candidate = start_date.checked_add_months(Months::new(next_k));
            match candidate {
                Some(next_date) if next_date > current_date => next_date,
                _ => current_date
                    .checked_add_months(Months::new(1))
                    .unwrap_or(current_date + chrono::Duration::days(30)),
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jan_31_anchor_drift_prevention() {
        let jan_31 = NaiveDate::from_ymd_opt(2026, 1, 31).unwrap();

        // Month 1: Jan 31 -> Feb 28
        let feb = compute_anchored_billing_date(jan_31, jan_31, "monthly");
        assert_eq!(feb, NaiveDate::from_ymd_opt(2026, 2, 28).unwrap());

        // Month 2: Feb 28 -> Mar 31 (anchored to 31st!)
        let mar = compute_anchored_billing_date(jan_31, feb, "monthly");
        assert_eq!(mar, NaiveDate::from_ymd_opt(2026, 3, 31).unwrap());

        // Month 3: Mar 31 -> Apr 30
        let apr = compute_anchored_billing_date(jan_31, mar, "monthly");
        assert_eq!(apr, NaiveDate::from_ymd_opt(2026, 4, 30).unwrap());

        // Month 4: Apr 30 -> May 31 (anchored to 31st!)
        let may = compute_anchored_billing_date(jan_31, apr, "monthly");
        assert_eq!(may, NaiveDate::from_ymd_opt(2026, 5, 31).unwrap());
    }

    #[test]
    fn test_feb_29_leap_year_anchor() {
        let leap_feb_29 = NaiveDate::from_ymd_opt(2024, 2, 29).unwrap();

        // Monthly: Feb 29 (leap) -> Mar 29
        let mar = compute_anchored_billing_date(leap_feb_29, leap_feb_29, "monthly");
        assert_eq!(mar, NaiveDate::from_ymd_opt(2024, 3, 29).unwrap());

        // Yearly: Feb 29 2024 (leap) -> Feb 28 2025 (non-leap)
        let next_year = compute_anchored_billing_date(leap_feb_29, leap_feb_29, "yearly");
        assert_eq!(next_year, NaiveDate::from_ymd_opt(2025, 2, 28).unwrap());
    }
}
