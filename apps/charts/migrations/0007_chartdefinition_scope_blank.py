# Generated by Django 2.2.9 on 2020-01-17 13:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('charts', '0006_chartdefinition_scope'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chartdefinition',
            name='scope',
            field=models.CharField(blank=True, choices=[('', 'any'), ('platform', 'platform'), ('title', 'title')], default='', max_length=10),
        ),
    ]
