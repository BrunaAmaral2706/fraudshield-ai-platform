"""
FraudShield Enterprise Risk Engine
Rule-based multi-factor fraud scoring (production reference implementation).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

CRITICAL_CATEGORIES = {
    "shopping_net",
    "grocery_pos",
    "misc_net",
    "shopping_pos",
}

SUSPICIOUS_HOURS = {0, 1, 2, 3, 22, 23}


@dataclass
class RiskResult:
    risk_score: int
    risk_level: str
    fraud_probability: float
    severity: str
    alert_level: str
    factors: list[dict[str, Any]]

    def to_dict(self) -> dict[str, Any]:
        return {
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "fraud_probability": self.fraud_probability,
            "severity": self.severity,
            "alert_level": self.alert_level,
            "factors": self.factors,
            "ai_explanation": self.build_explanation(),
        }

    def build_explanation(self) -> str:
        if not self.factors:
            return "Standard risk profile — no critical factors detected"
        labels = [f["label"].lower() for f in self.factors]
        return f"Risk increased because: {', '.join(labels)}"


def get_risk_level(score: int) -> str:
    if score >= 85:
        return "CRITICAL"
    if score >= 70:
        return "HIGH"
    if score >= 45:
        return "MEDIUM"
    return "LOW"


def get_alert_level(risk_level: str) -> str:
    return {"CRITICAL": "critical", "HIGH": "high", "MEDIUM": "medium", "LOW": "low"}.get(
        risk_level, "low"
    )


def map_severity(risk_level: str, fraud_probability: float) -> str:
    if fraud_probability >= 0.85 or risk_level == "CRITICAL":
        return "CRITICAL"
    if fraud_probability >= 0.65 or risk_level == "HIGH":
        return "HIGH"
    if fraud_probability >= 0.4 or risk_level == "MEDIUM":
        return "WARNING"
    return "INFO"


def compute_risk_score(
    amount: float,
    transaction_hour: int,
    category: str,
    velocity_fraud: int = 1,
    amount_zscore: float = 0.0,
    anomaly_behavior: float = 0.0,
) -> RiskResult:
    """Enterprise rule engine — mirrors FraudShield production scoring."""
    score = 0
    factors: list[dict[str, Any]] = []
    cat = (category or "").lower()

    if amount > 1000:
        score += 30
        factors.append(
            {
                "factor": "high_amount",
                "label": "High transaction amount",
                "impact": "critical" if amount > 5000 else "high",
                "detail": f"${amount:,.2f} exceeds $1,000 threshold",
            }
        )
    elif amount > 500:
        score += 12

    if transaction_hour in (22, 23) or transaction_hour in SUSPICIOUS_HOURS:
        score += 20
        factors.append(
            {
                "factor": "suspicious_hour",
                "label": "Suspicious hour",
                "impact": "high",
                "detail": f"Transaction at {transaction_hour:02d}:00",
            }
        )

    if cat == "shopping_net" or cat in CRITICAL_CATEGORIES:
        bonus = 25 if cat == "shopping_net" else 18
        score += bonus
        factors.append(
            {
                "factor": "risky_category",
                "label": "High-risk category",
                "impact": "high",
                "detail": f"Category '{category}' flagged as critical",
            }
        )

    if velocity_fraud > 5:
        score += 40
        factors.append(
            {
                "factor": "velocity_fraud",
                "label": "Elevated velocity fraud",
                "impact": "critical",
                "detail": f"{velocity_fraud} transactions on same card",
            }
        )
    elif velocity_fraud > 2:
        score += 15

    if abs(amount_zscore) > 2:
        score += 10
        factors.append(
            {
                "factor": "amount_zscore",
                "label": "Statistical amount anomaly",
                "impact": "medium",
                "detail": f"Amount z-score {amount_zscore:.2f}",
            }
        )

    if anomaly_behavior > 0.5:
        score += 12
        factors.append(
            {
                "factor": "anomaly_behavior",
                "label": "Anomaly detected",
                "impact": "high",
                "detail": f"Behavioral anomaly score {anomaly_behavior:.2f}",
            }
        )

    score = min(99, score + 10)  # baseline fraud dataset bias
    risk_level = get_risk_level(score)
    fraud_probability = min(0.99, round(score / 100 + (velocity_fraud > 5) * 0.1, 4))
    severity = map_severity(risk_level, fraud_probability)
    alert_level = get_alert_level(risk_level)

    return RiskResult(
        risk_score=score,
        risk_level=risk_level,
        fraud_probability=fraud_probability,
        severity=severity,
        alert_level=alert_level,
        factors=factors,
    )


if __name__ == "__main__":
    sample = compute_risk_score(2500, 23, "shopping_net", velocity_fraud=6)
    print("[RISK_ENGINE] Sample:", sample.to_dict())
