import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  public fb = inject(FormBuilder);
  private router = inject(Router);

  form = this.fb.group({
    email:['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  })

  onSubmit(){
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return ;
    }

    console.log(this.form.value);
    this.router.navigate(['/proyectos']);
  }

}
