# employees/management/commands/seed.py
# Run with: python manage.py seed
# Place this file at:
#   employees/management/__init__.py   (empty)
#   employees/management/commands/__init__.py  (empty)
#   employees/management/commands/seed.py      (this file)

from django.core.management.base import BaseCommand
from employees.models import Employee

SEED_DATA = [
    ("Ana", "García", "Engineering", "Senior Engineer", 95000),
    ("James", "Okafor", "Engineering", "Backend Developer", 87000),
    ("Li", "Wei", "Marketing", "Campaign Manager", 72000),
    ("Sara", "Müller", "HR", "HR Business Partner", 68000),
    ("Carlos", "Rivera", "Sales", "Account Executive", 76000),
    ("Priya", "Nair", "Finance", "Financial Analyst", 80000),
    ("Tom", "Nielsen", "Engineering", "Frontend Developer", 84000),
    ("Amara", "Diallo", "Operations", "Operations Manager", 91000),
    ("Sophie", "Dupont", "Marketing", "Content Strategist", 66000),
    ("Kenji", "Tanaka", "Engineering", "DevOps Engineer", 98000),
    ("Fatima", "Al-Hassan", "HR", "Recruiter", 62000),
    ("Marco", "Rossi", "Sales", "Sales Manager", 110000),
    ("Ingrid", "Larsson", "Finance", "Controller", 105000),
    ("Yaw", "Asante", "Engineering", "Data Engineer", 93000),
    ("Mei", "Chen", "Marketing", "Growth Lead", 88000),
    ("Arjun", "Sharma", "Operations", "Supply Chain Analyst", 74000),
    ("Elena", "Petrov", "Engineering", "QA Engineer", 78000),
    ("Noah", "Williams", "Sales", "Business Dev Rep", 65000),
    ("Hana", "Kimura", "HR", "Payroll Specialist", 60000),
    ("David", "Osei", "Finance", "Budget Analyst", 77000),
    ("Clara", "Santos", "Engineering", "Tech Lead", 115000),
    ("Ravi", "Patel", "Marketing", "SEO Specialist", 69000),
    ("Awa", "Traoré", "Operations", "Logistics Coordinator", 61000),
    ("Erik", "Andersen", "Sales", "Enterprise AE", 120000),
    ("Mia", "Johansson", "Engineering", "Mobile Developer", 89000),
    ("Oluwaseun", "Adeyemi", "Finance", "Accounts Payable", 59000),
    ("Lena", "Bauer", "HR", "Training Coordinator", 63000),
    ("Diego", "Herrera", "Engineering", "Platform Engineer", 97000),
    ("Aisha", "Mohammed", "Marketing", "Social Media Manager", 67000),
    ("Takeshi", "Yamamoto", "Operations", "Procurement Specialist", 72000),
    ("Isabelle", "Leclerc", "Sales", "Inside Sales Rep", 64000),
    ("Felix", "Brandt", "Engineering", "Security Engineer", 102000),
    ("Nadia", "Kowalski", "Finance", "FP&A Analyst", 83000),
    ("Samuel", "Mensah", "HR", "Benefits Administrator", 58000),
    ("Victoria", "Kozlov", "Engineering", "Machine Learning Engineer", 125000),
    ("Kai", "Fischer", "Marketing", "Brand Manager", 85000),
    ("Amira", "Ben-Ali", "Operations", "Project Coordinator", 71000),
    ("Lucas", "Martins", "Sales", "Regional Manager", 108000),
    ("Yuna", "Park", "Engineering", "Full Stack Developer", 91000),
    ("Omar", "Ibrahim", "Finance", "Tax Specialist", 86000),
    ("Hannah", "Schmidt", "HR", "HR Coordinator", 61000),
    ("Darius", "Popescu", "Engineering", "Embedded Systems", 94000),
    ("Chiara", "Ferrari", "Marketing", "Product Marketer", 81000),
    ("Kwame", "Boateng", "Operations", "Quality Analyst", 68000),
    ("Alice", "Nguyen", "Sales", "Solutions Consultant", 96000),
    ("Rafael", "Morales", "Finance", "Treasury Analyst", 79000),
    ("Leila", "Ahmadi", "Engineering", "Cloud Architect", 130000),
    ("Jordan", "Campbell", "HR", "Talent Acquisition", 70000),
    ("Sven", "Eriksson", "Operations", "Facilities Manager", 65000),
    ("Nneka", "Obi", "Sales", "VP of Sales", 145000),
]


class Command(BaseCommand):
    help = "Seed the database with 50 realistic employee records."

    def handle(self, *args, **options):
        if Employee.objects.exists():
            self.stdout.write("Database already seeded -- skipping.")
            return

        employees = [
            Employee(
                first_name=first,
                last_name=last,
                department=dept,
                role=role,
                salary=salary,
            )
            for first, last, dept, role, salary in SEED_DATA
        ]

        Employee.objects.bulk_create(employees)
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(employees)} employees."))
